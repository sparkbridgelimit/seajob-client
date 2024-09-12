use crate::browser::default_executable;
use crate::login::{self, check_auth};
use crate::service::job_define::{
    create_task, get_last_cookie, save_cookie, JobDefineCookieReq, JobDefineRunRequest,
    JobDefineSaveCookieRequest,
};
use crate::{store, task};
use std::path::PathBuf;
use std::process::{Command, Stdio};

use log::info;
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
        return Err("First QR code scan failed".to_string());
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
        return Err("Second QR code scan failed".to_string());
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

// 生成并保存新的 cookie
async fn gen_and_save_cookie(id: i64, app: AppHandle) -> Result<String, String> {
    let new_cookie = gen_cookie(app.clone()).await?;
    // 关闭弹窗
    app.emit_all("scan-success", ()).unwrap();
    save_cookie(JobDefineSaveCookieRequest {
        job_define_id: id,
        cookie: new_cookie.clone(),
    })
    .await
    .map_err(|e| e.to_string())?;
    Ok(new_cookie)
}

#[tauri::command]
pub async fn run_job_define(
    id: i64,
    count: i32,
    headless: bool,
    app: AppHandle,
) -> Result<i64, String> {
    info!("运行任务的 ID: {}, 目标次数: {}", id, count);
    // 获取或生成 cookie
    let _cookie = match get_last_cookie(JobDefineCookieReq { job_define_id: id }).await {
        Ok(res) => {
            info!("缓存的cookie: {}", res.wt2_cookie);
            // 检查 cookie 是否有效
            if check_auth(&res.wt2_cookie).await.unwrap_or(false) {
                info!("cookie有效");
                res.wt2_cookie
            } else {
                // 如果无效，生成新的 cookie
                gen_and_save_cookie(id, app.clone()).await?
            }
        }
        Err(_) => {
            // 没有 cookie，生成新的 cookie
            info!("没有cookie, 生成新的 cookie");
            gen_and_save_cookie(id, app.clone()).await?
        }
    };

    let run_req = JobDefineRunRequest {
        job_define_id: id,
        target_num: count,
    };

    // 创建任务
    let create_task_result = create_task(run_req).await.map_err(|e| e.to_string())?;

    info!("任务创建成功: {:?}", create_task_result);
    app.emit_all("job_starting", id).unwrap();
    task::run_task(
        app.clone(),
        create_task_result,
        headless,
        default_executable().unwrap(),
    )
    .await
    .map_err(|e| e.to_string())?;

    app.emit_all("job_finish", id).unwrap();
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
    let path: std::path::PathBuf = default_executable().map_err(|e| e.to_string())?;
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
    let mut child = Command::new(executor_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start process: {}", e.to_string()))?;

    Ok("Process started".to_string())
}
