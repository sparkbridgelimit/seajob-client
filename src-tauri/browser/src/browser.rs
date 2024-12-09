use app::app_handler::get_app;
use regex::Regex;
use std::error::Error;
use std::path::PathBuf;
use tauri::Manager;

use log::{error, info};
use serde::Serialize;
use serde_json::Value;
use tokio::{
    io::{AsyncBufReadExt, BufReader},
    process::Child,
    sync::mpsc,
};

use crate::utils::{
    get_bee_headless_path, get_launch_path, get_user_data_dir, launch_subprocess,
    prepare_launch_params,
};

/// 结构体用于序列化启动参数。
#[derive(Serialize)]
pub struct LaunchParams {
    pub user_data_dir: String,
    pub chrome_path: String,
    pub task: String,
    pub payload: Value,
    pub headless: bool,
    pub auto_close: bool,
}

/// 表示浏览器实例的简要信息，用于前端展示
#[derive(Serialize, Clone)]
pub struct BrowserInfo {
    pub id: String,
    pub user_data_dir: String,
    pub task: String,
    pub headless: bool,
    pub auto_close: bool,
}

/// 表示与用户关联的浏览器实例
pub struct Browser {
    /// 唯一标识符
    pub id: String,

    // 浏览器内核路径
    pub chrome_path_str: String,

    /// 浏览器子进程句柄
    pub child_process: Option<Child>,

    /// 浏览器的用户数据目录
    pub user_data_dir: PathBuf,

    /// 浏览器任务类型（例如 "fingerprint-detect"）
    pub task: String,

    /// 浏览器负载数据（JSON 格式）
    pub payload: serde_json::Value,

    /// 是否以无头模式运行
    pub headless: bool,

    /// 是否自动关闭浏览器
    pub auto_close: bool,

    /// 发送退出通知的通道
    exit_sender: mpsc::Sender<String>,
}

impl Browser {
    pub async fn new(
        id: &str,
        task: &str,
        payload: serde_json::Value,
        headless: bool,
        auto_close: bool,
        exit_sender: &mpsc::Sender<String>,
    ) -> Result<Self, Box<dyn Error>> {
        // 获取用户数据目录
        let user_data_dir = get_user_data_dir(id)?;

        let chrome_path: std::path::PathBuf =
            get_launch_path().map_err(|e| format!("获取启动路径失败: {}", e))?;

        // 将 `PathBuf` 转换为 `String`
        let chrome_path_str = chrome_path
            .to_str()
            .ok_or_else(|| "无法将 Chrome 路径转换为字符串".to_string())?;

        Ok(Self {
            id: id.to_string(),
            chrome_path_str: chrome_path_str.to_string(),
            child_process: None,
            user_data_dir,
            task: task.to_string(),
            payload,
            headless,
            auto_close,
            exit_sender: exit_sender.clone(),
        })
    }

    pub async fn launch(&mut self) -> Result<(), String> {
        // 检查并清理残留的 SingletonLock 文件
        self.clean_singleton_lock()?;

        // 准备启动参数
        let json_params = prepare_launch_params(
            &self.user_data_dir,
            &self.chrome_path_str,
            &self.task,
            self.payload.clone(),
            self.headless,
            self.auto_close,
        )?;

        let headless = get_bee_headless_path().map_err(|e| {
            error!("获取 headless 路径失败: {}", e);
            format!("初始化失败: {}", e)
        })?;

        // 启动子进程
        let child = launch_subprocess(&headless, json_params.to_string()).await?;
        if self.child_process.is_some() {
            error!("浏览器实例已存在，重复启动可能导致不一致。");
            return Err("浏览器实例已存在，重复启动可能导致不一致。".to_string());
        }

        self.child_process = Some(child);

        // 处理子进程输出
        self.handle_subprocess_output()?;

        // 监听进程退出
        self.listen_process_exit().await?;

        Ok(())
    }

    /// 停止浏览器子进程
    pub async fn stop(&mut self) -> Result<(), String> {
        if let Some(child) = &mut self.child_process {
            child
                .kill()
                .await
                .map_err(|e| format!("无法停止浏览器进程: {}", e))?;
            self.child_process = None;
            info!("用户 {} 的浏览器已停止", self.id);
            Ok(())
        } else {
            Err(format!("用户 {} 的浏览器未运行", self.id))
        }
    }

    /// 处理子进程的输出流（标准输出和标准错误）
    fn handle_subprocess_output(&mut self) -> Result<(), String> {
        let log_pattern =
            Regex::new(r"^OK \| (\d+) \| (.+?) \| \[(\d+)-(\d+)K\] \| (https?://[^\s]+)$")
                .expect("Invalid regex");
        let json_result_re = Regex::new(r#"^json_result:(\{.*\})$"#).map_err(|e| e.to_string())?;
        let app = get_app().ok_or("AppHandle 未初始化")?;

        // 处理标准输出
        if let Some(stdout) = self.child_process.as_mut().and_then(|c| c.stdout.take()) {
            let stdout_reader: tokio::io::Lines<BufReader<tokio::process::ChildStdout>> =
                BufReader::new(stdout).lines();
            tokio::spawn(async move {
                let mut lines = stdout_reader;
                while let Ok(Some(line)) = lines.next_line().await {
                    info!("STDOUT: {}", line);
                    app.emit_all("run_log", line.clone()).unwrap();

                    // 匹配 JSON 结果
                    if let Some(captures) = json_result_re.captures(&line) {
                        if let Some(json_str) = captures.get(1) {
                            match serde_json::from_str::<serde_json::Value>(json_str.as_str()) {
                                Ok(json_value) => {
                                    if let Err(err) = app.emit_all("json_result", json_value) {
                                        error!("Failed to emit JSON result event: {}", err);
                                    }
                                }
                                Err(err) => {
                                    error!("Failed to parse JSON from log: {}", err);
                                }
                            }
                        }
                    }
                    if let Some(_) = log_pattern.captures(&line) {
                        app.emit_all("greet_done", &line).unwrap();
                    }
                }
            });
        }

        // 处理标准错误
        if let Some(stderr) = self.child_process.as_mut().and_then(|c| c.stderr.take()) {
            let stderr_reader = BufReader::new(stderr).lines();
            tokio::spawn(async move {
                let mut lines = stderr_reader;
                while let Ok(Some(line)) = lines.next_line().await {
                    error!("STDERR: {}", line);
                }
            });
        }

        Ok(())
    }

    /// 监听子进程退出，并发送通知给 BrowserManager
    async fn listen_process_exit(&mut self) -> Result<(), String> {
        let id = self.id.clone();
        let exit_sender = self.exit_sender.clone();

        let mut child = self
            .child_process
            .take()
            .ok_or(format!("用户 {} 的浏览器进程未启动", id))?;

        tokio::spawn(async move {
            match child.wait().await {
                Ok(status) => {
                    if status.success() {
                        log::info!("用户 {} 的浏览器已正常退出", id);
                    } else {
                        log::error!("用户 {} 的浏览器异常退出: {:?}", id, status.code());
                    }

                    if let Err(e) = exit_sender.send(id.clone()).await {
                        log::error!("无法发送退出通知: {}", e);
                    }

                    if let Some(app_handle) = get_app() {
                        if let Err(e) = app_handle.emit_all("browser_closed", id.clone()) {
                            log::error!("发送浏览器关闭事件失败: {}", e);
                        }
                    }
                }
                Err(e) => {
                    log::error!("等待用户 {} 的浏览器进程失败: {}", id, e);
                }
            }
        });

        Ok(())
    }

    /// 清理残留的 SingletonLock 文件
    fn clean_singleton_lock(&self) -> Result<(), String> {
        let lock_file = self.user_data_dir.join("SingletonLock");

        // 输出要检查的文件位置
        info!("正在检查 SingletonLock 文件位置: {:?}", lock_file);

        // 判断文件是否存在
        if lock_file.exists() {
            info!("SingletonLock 文件存在: {:?}", lock_file);

            // 尝试删除文件
            std::fs::remove_file(&lock_file).map_err(|e| {
                let err_msg = format!("无法删除 SingletonLock 文件: {}", e);
                error!("{}", err_msg);
                err_msg
            })?;
            info!("SingletonLock 文件已成功删除: {:?}", lock_file);
        } else {
            info!("SingletonLock 文件不存在: {:?}", lock_file);
        }

        Ok(())
    }

    /// 检查浏览器是否正在运行
    pub fn is_running(&self) -> bool {
        self.child_process.is_some()
    }
}
