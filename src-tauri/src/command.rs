use crate::emit::send_install_log;
use crate::login::{self, check_auth};
use crate::service::job_define::{
    create_task, get_last_cookie, save_cookie, JobDefineCookieReq, JobDefineRunRequest,
    JobDefineSaveCookieRequest,
};
use crate::{store, task};
use std::fs;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::time::Instant;

use app::app_handler::get_app;
use browser::browser::BrowserInfo;
use browser::browser_manager::BrowserManager;
use browser::fetcher::{Fetcher, FetcherOptions, Revision};
use browser::utils::get_launch_path;
use log::{error, info};
use serde_json::Value;
use tauri::{AppHandle, Manager};

pub async fn gen_cookie(app: AppHandle) -> Result<String, String> {
    info!("生成cookie");
    let randkey = login::get_randkey().await.map_err(|e| e.to_string())?;
    app.emit_all("login-first-randkey", randkey.clone())
        .unwrap();

    // 等待第一次扫码
    let scan_success = login::wait_qrcode_scan(&randkey)
        .await
        .map_err(|e| e.to_string())?;
    if !scan_success {
        app.emit_all("scan-failed", randkey.clone()).unwrap();
        return Err("第一次二维码扫描失败".to_string());
    }

    // 获取二次key
    let second_key = login::get_second_key(&randkey)
        .await
        .map_err(|e| e.to_string())?;

    // 发送给前端
    app.emit_all("login-second-key", second_key.clone())
        .unwrap();

    // 等待第二次扫码
    let second_scan_success = login::scan_second_qrcode(&second_key)
        .await
        .map_err(|e| e.to_string())?;

    if !second_scan_success {
        app.emit_all("scan-failed", second_key.clone()).unwrap();
        return Err("第二次二维码扫描失败".to_string());
    }

    // 等待确认
    login::wait_confirm(&randkey)
        .await
        .map_err(|e| e.to_string())?;

    // 分发二维码并保存到本地
    let cookies = login::dispatch_qrcode(&randkey)
        .await
        .map_err(|e| e.to_string())?;

    info!("Cookies: {:?}", cookies);

    // 从cookies获取cookie中wt2字段
    if let Some(wt2_value) = cookies.get("wt2") {
        info!("wt2: {}", wt2_value);
        Ok(wt2_value.clone())
    } else {
        Err("wt2字段不存在".to_string())
    }
}

#[tauri::command]
pub async fn check_boss_cookie(id: i64) -> Result<bool, String> {
    info!("检测用户的cookie是否存在: {}", id);

    // 获取缓存的 cookie
    let res = match get_last_cookie(JobDefineCookieReq { job_define_id: id }).await {
        Ok(res) => res,
        Err(e) => {
            error!("获取cookie失败: {}", e);
            return Err(format!("获取cookie失败: {}", e));
        }
    };

    // 检查 cookie 是否存在并验证有效性
    if res.wt2_cookie.is_empty() {
        info!("未找到缓存的cookie");
        return Ok(false);
    }

    if check_auth(&res.wt2_cookie).await.unwrap_or(false) {
        info!("cookie有效");
        Ok(true)
    } else {
        info!("cookie无效");
        Ok(false)
    }
}

#[tauri::command]
pub async fn init_boss_cookie(id: i64, app: AppHandle) -> Result<bool, String> {
    info!("初始化新的cookie: job_define_id={}", id);

    // 生成 cookie
    let new_cookie = match gen_cookie(app.clone()).await {
        Ok(cookie) => cookie,
        Err(e) => {
            error!("生成cookie失败: {}", e);
            return Err(format!("生成cookie失败: {}", e));
        }
    };

    // 保存 cookie
    match save_cookie(JobDefineSaveCookieRequest {
        job_define_id: id,
        cookie: new_cookie.clone(),
    })
    .await
    {
        Ok(_) => {
            info!("cookie保存成功: {}", new_cookie);
            app.emit_all("scan-success", ()).unwrap();
            Ok(true) // 生成并保存成功
        }
        Err(e) => {
            error!("保存cookie失败: {}", e);
            app.emit_all("scan-fail", ()).unwrap();
            Err(format!("保存cookie失败: {}", e)) // 保存失败
        }
    }
}

#[tauri::command]
pub async fn run_job_define(
    id: i64,
    count: i32,
    headless: bool,
    app: AppHandle,
) -> Result<i64, String> {
    info!("运行任务的 ID: {}, 目标次数: {}", id, count);
    let run_req = JobDefineRunRequest {
        job_define_id: id,
        target_num: count,
    };

    // 创建任务
    let create_task_result = create_task(run_req).await.map_err(|e| e.to_string())?;

    info!("任务创建成功: {:?}", create_task_result);

    // 将任务结果转换为 JSON
    let json_value: Value = serde_json::to_value(&create_task_result)
        .map_err(|e| format!("Failed to convert task result to JSON: {}", e))?;


    // 执行任务
    task::run(&id.to_string(), "run", headless, json_value)
        .await
        .map_err(|e| e.to_string())?;

    app.emit_all("job_started", id).unwrap();

    Ok(id)
}

#[tauri::command]
pub fn set_token(token: String) -> Result<(), String> {
    info!("设置token: {}", token);
    let _ = store::set("token", token);
    Ok(())
}

#[tauri::command]
pub fn get_token() -> Result<String, String> {
    // 从 store 中获取 token
    let token = match store::get("token") {
        Some(Value::String(token)) => Ok(token),
        Some(_) => Err("Stored value is not a string".to_string()),
        None => Err("Token not found".to_string()),
    }
    .map_err(|e| e.to_string())?;
    info!("获取token {}", token);
    Ok(token)
}

#[tauri::command]
pub fn clear_token() -> Result<(), String> {
    info!("清除token");
    let _ = store::delete("token");
    Ok(())
}

#[tauri::command]
pub fn detect_chrome() -> Result<String, String> {
    info!("检测chrome");
    let path: std::path::PathBuf = get_launch_path().map_err(|e| e.to_string())?;
    if !path.exists() {
        return Err("Chrome路径不存在".to_string());
    }
    info!("Chrome路径: {:?}", path);
    Ok(path.to_str().unwrap().to_string())
}

#[tauri::command]
pub fn test_bin(app: AppHandle) -> Result<String, String> {
    // 根据操作系统和架构选择相应的二进制文件
    let binary_name = match (std::env::consts::OS, std::env::consts::ARCH) {
        ("windows", _) => "resources/seajob-executor-win.exe",
        ("macos", "x86_64") => "resources/seajob-executor-macos",
        ("macos", "aarch64") => "resources/seajob-executor-macos-arm64",
        ("linux", _) => "resources/seajob-executor-linux",
        _ => return Err("Unsupported OS or architecture".to_string()),
    };

    let executor_path: PathBuf = app
        .path_resolver()
        .resolve_resource(binary_name)
        .ok_or_else(|| "Failed to resolve resource".to_string())?;

    // 打印可执行文件路径以进行调试
    println!("Executable path: {:?}", executor_path);

    // 检查文件是否存在以及是否有执行权限
    if !executor_path.exists() {
        return Err(format!("Executable not found at: {:?}", executor_path));
    }

    // 启动子进程
    let _child = Command::new(executor_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start process: {}", e.to_string()))?;

    Ok("Process started".to_string())
}

#[tauri::command]
pub async fn install_chrome() -> Result<String, String> {
    // 使用 tokio::spawn_blocking 将阻塞操作放到后台任务
    let result = tokio::task::spawn_blocking(move || {
        // 设置 FetcherOptions
        #[allow(unused_assignments)]
        let mut v: &str = "";
        #[cfg(windows)]
        {
            v = "1355004"
        }

        #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
        {
            v = "1355021"
        }

        #[cfg(all(target_os = "macos", not(target_arch = "aarch64")))]
        {
            v = "1355028"
        }
        let rev = Revision::Specific(v.to_string());
        let fetcher_options = FetcherOptions::default()
            .with_revision(rev) // 改为安装最新版本
            .with_allow_download(true); // 允许下载

        // 创建 Fetcher 实例
        let fetcher = Fetcher::new(fetcher_options);

        // 启动下载和安装流程
        let start_time = Instant::now(); // 记录安装开始时间
        send_install_log("开始安装Chrome");

        // 调用 fetch() 方法，进行安装
        match fetcher.fetch() {
            Ok(chrome_path) => {
                let elapsed = start_time.elapsed();
                send_install_log(&format!("Chrome 成功安装在 {:?}", chrome_path));
                send_install_log(&format!("安装耗时 {:.2?}", elapsed));
                Ok(format!(
                    "Chrome installed at: {:?}, Installation took {:.2?}",
                    chrome_path, elapsed
                ))
            }
            Err(e) => {
                send_install_log(&format!("安装Chrome失败: {:?}", e));
                error!("Failed to install Chrome: {:?}", e);
                Err(format!("Failed to install Chrome: {:?}", e))
            }
        }
    })
    .await
    .map_err(|e| format!("Task failed: {:?}", e))?; // 展开外层的 Result 并处理错误

    result // 返回内层的 Result
}

#[tauri::command]
pub async fn launch_browser(
    id: String,
    task: String,
    mut payload: Value,
    headless: Option<bool>,
    auto_close: Option<bool>
) -> Result<BrowserInfo, String> {
    let headless = headless.unwrap_or(false);
    let auto_close = auto_close.unwrap_or(false);
    let app = get_app().ok_or("AppHandle 未初始化")?;
    
    let job_define_id: i64 = id.parse().map_err(|_| "Invalid ID: unable to parse as i64")?;

    // 获取最新的 cookie
    let cookie = get_last_cookie(JobDefineCookieReq { job_define_id })
        .await
        .map_err(|err| format!("Failed to get last cookie: {}", err))?;
    
    payload["wt2Cookie"] = serde_json::Value::String(cookie.wt2_cookie);
    // 获取 BrowserManager 实例
    let browser_manager = app.state::<BrowserManager>();
    browser_manager.start(id, task, payload, headless, auto_close).await
}

#[tauri::command]
pub async fn clear_user_data_dir(id: String) -> Result<String, String> {
    let user_data_dir = browser::utils::get_user_data_dir(&id).map_err(|err| {
        error!("获取用户数据目录失败: {}", err);
        format!("获取用户数据目录失败: {}", err)
    })?;

    if !user_data_dir.exists() {
        return Err(format!("用户数据目录不存在: {}", user_data_dir.display()));
    }

    fs::remove_dir_all(&user_data_dir).map_err(|err| {
        error!("删除用户数据目录失败: {}", err);
        format!("删除用户数据目录失败: {}", err.to_string())
    })?;

    Ok(format!("用户数据目录已删除: {}", user_data_dir.display()))
}

#[tauri::command]
pub async fn show_user_data_dir(id: String) -> Result<String, String> {
    let user_data_dir = browser::utils::get_user_data_dir(&id).map_err(|err| {
        error!("获取用户数据目录失败: {}", err);
        format!("获取用户数据目录失败: {}", err)
    })?;

    if !user_data_dir.exists() {
        return Err(format!("用户数据目录不存在: {}", user_data_dir.display()));
    }
    
    Ok(user_data_dir.to_string_lossy().to_string())
}