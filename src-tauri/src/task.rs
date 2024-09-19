use crate::service::job_define::JobDefineRunRes;
use crate::helper::remove_quarantine_attribute;
use log::info;
use regex::Regex;
use serde::Serialize;
use std::env;
use std::fs::{self, Permissions};
use std::path::PathBuf;
use std::process::Stdio;
use tauri::{AppHandle, Manager};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use std::os::unix::fs::PermissionsExt; // 用于设置 Unix 风格的权限

#[derive(Serialize)]
pub struct TaskLogPayLoad {
    pub full_name: String,
    pub salary_min: String,
    pub salary_max: String,
    pub detail_url: String,
}

pub async fn run_task(
    app: AppHandle,
    param: JobDefineRunRes,
    headless: bool,
    chrome_path: PathBuf,
) -> Result<(), String> {
    // 根据操作系统和架构选择相应的二进制文件
    let binary_name = match (std::env::consts::OS, std::env::consts::ARCH) {
        ("windows", _) => "resources/seajob-executor-windows-x64.exe",
        ("macos", "x86_64") => "resources/seajob-executor-macos-x64",
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

    // 设置环境变量
    env::set_var(
        "CHROME_PATH",
        chrome_path
            .to_str()
            .ok_or_else(|| "Failed to convert chrome path to string".to_string())?,
    );
    println!("Chrome_path path: {:?}", chrome_path);

    // 设置job_define
    env::set_var("job_task_id", param.job_task_id.to_string());
    env::set_var("keyword", param.keyword.to_string());
    env::set_var("city_code", param.city_code.to_string());
    env::set_var("salary_range", param.salary_range.to_string());
    env::set_var("key_kills", param.key_kills.to_string());
    env::set_var("exclude_company", param.exclude_company.to_string());
    env::set_var("exclude_job", param.exclude_job.to_string());
    env::set_var("interval", param.interval.to_string());
    env::set_var("hello_txt", param.hello_text.to_string());
    env::set_var("timeout", param.timeout.to_string());
    env::set_var("target_num", param.target_num.to_string());
    env::set_var("wt2_cookie", param.wt2_cookie.to_string());

    let h = match headless {
        true => "true",
        false => "false",
    };
    env::set_var("headless", h.to_string());

    // 设置文件为可执行权限 (仅适用于非 Windows 系统)
    #[cfg(unix)]
    {
        let permissions = Permissions::from_mode(0o755); // rwxr-xr-x
        fs::set_permissions(&executor_path, permissions).map_err(|e| {
            let err_msg = format!("Failed to set executable permissions: {}", e);
            eprintln!("{}", err_msg);
            err_msg
        })?;
    }

    // 清楚apple安全标记
    #[cfg(all(target_os = "macos"))]
    if let Err(e) = remove_quarantine_attribute(&executor_path) {
        eprintln!("{}", e);
        return Err("清楚apple安全标记失败".to_string());
    }

    let mut child = Command::new(executor_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| {
            let err_msg = format!("Failed to start the process: {}", e);
            eprintln!("{}", err_msg);
            err_msg
        })?;

    let log_pattern =
        Regex::new(r"^OK \| (\d+) \| (.+?) \| \[(\d+)-(\d+)K\] \| (https?://[^\s]+)$")
            .expect("Invalid regex");

    // 子进程的标准输出
    if let Some(stdout) = child.stdout.take() {
        let mut stdout_reader = BufReader::new(stdout).lines();
        tokio::spawn(async move {
            while let Ok(Some(line)) = stdout_reader.next_line().await {
                info!("STDOUT: {}", line);
                app.emit_all("run_log", line.clone()).unwrap();
                if let Some(_) = log_pattern.captures(&line) {
                    app.emit_all("greet_done", &line).unwrap();
                }
            }
        });
    }

    // 子进程的标准错误
    if let Some(stderr) = child.stderr.take() {
        let mut stderr_reader = BufReader::new(stderr).lines();
        tokio::spawn(async move {
            while let Ok(Some(line)) = stderr_reader.next_line().await {
                println!("STDERR: {}", line);
                info!("STDERR: {}", line);
            }
        });
    }

    let output = child.wait_with_output().await.map_err(|e| e.to_string())?;

    println!("Command executed with status: {:?}", output.status);
    info!("Command executed with status: {:?}", output.status);

    if !output.status.success() {
        return Err(format!(
            "Command exited with non-zero status: {:?}",
            output.status
        ));
    }

    return Ok(());
}
