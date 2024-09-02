use log::info;
use std::process::Stdio;
use std::env;
use tauri::{AppHandle, Manager};
use crate::service::job_define::JobDefineRunRes;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

pub async fn run_task(app: AppHandle, param: JobDefineRunRes, headless: bool) -> Result<(), String> {
    let executor_path = app
        .path_resolver()
        .resolve_resource("resources/seajob-executor")
        .expect("failed to resolve resource");

    // 打印可执行文件路径以进行调试
    println!("Executable path: {:?}", executor_path);

    let chrome_path = app
        .path_resolver()
        .resolve_resource(
            "resources/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
        )
        .expect("failed to resolve resource");

    // 设置环境变量
    env::set_var(
        "CHROME_PATH",
        chrome_path
            .to_str()
            .ok_or_else(|| "Failed to convert chrome path to string".to_string())?,
    );
    println!("Chrome_path path: {:?}", chrome_path);

    // 设置job_define
    env::set_var("job_define_id", param.job_define_id.to_string());
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

    let mut child = Command::new(executor_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

    if let Some(stdout) = child.stdout.take() {
        let mut stdout_reader = BufReader::new(stdout).lines();
        tokio::spawn(async move {
            while let Ok(Some(line)) = stdout_reader.next_line().await {
                println!("STDOUT: {}", line);
                info!("STDOUT: {}", line);
                app.emit_all("run_log", line).unwrap();
            }
        });
    }

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
        return Err(format!("Command exited with non-zero status: {:?}", output.status));
    }

    return Ok(());
}
