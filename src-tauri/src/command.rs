use crate::login;
use crate::login::check_auth;
use crate::service::job_define::{
    create_task, get_last_cookie, save_cookie, JobDefineCookieReq, JobDefineRunRequest, JobDefineSaveCookieRequest
};
use crate::store;
use crate::task;

use log::info;
use serde_json::Value;
use tauri::{AppHandle, Manager};

pub async fn gen_cookie(app: AppHandle) -> Result<String, String> {
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

/// 先查询上一个cookie是否有效, 有效则创建任务
/// 无效则生成新的cookie
/// 保存cookie
/// 创建任务
/// 运行任务
#[tauri::command]
pub async fn run_job_define(id: i64, app: AppHandle) -> Result<(), String> {
    info!("运行任务的 ID: {}", id);
    // 根据defineid查询job_param是否有wt2cookie

    let _cookie_res = get_last_cookie(JobDefineCookieReq { job_define_id: id })
        .await
        .map_err(|e| e.to_string())?;

    // 如果有cookie校验是否有效
    // if let Some(c) = cookie_res {
    //     if check_auth(&c.wt2_cookie)
    //         .await
    //         .map_err(|e| e.to_string())?
    //     {
    //         return task::run_job(app, c.clone())
    //             .await
    //             .map_err(|e| e.to_string());
    //     }
    // }

    let create_task_req = JobDefineRunRequest {
        job_define_id: id,
        target_num: 1,
    };

    // 创建任务
    let task_result = create_task(create_task_req)
        .await
        .map_err(|e| e.to_string())?;
    info!("Task created successfully: {:?}", task_result);

    // 检查 wt2_cookie，如果存在并且有效，直接运行任务
    if !task_result.wt2_cookie.is_empty()
        && check_auth(&task_result.wt2_cookie)
            .await
            .map_err(|e| e.to_string())?
    {
        return task::run_job(app, task_result.clone())
            .await
            .map_err(|e| e.to_string());
    }

    // 没有cookie则生成
    let cookie_res = gen_cookie(app.clone()).await;

    match cookie_res {
        Ok(ref cookie) => {
            info!("cookie {:?}", cookie);
            app.emit_all("scan-success", ())
                .map_err(|e| e.to_string())?;
        }
        Err(_) => {
            app.emit_all("scan-fail", ()).map_err(|e| e.to_string())?; // 转换错误类型
        }
    }
    // 保存cookie
    let save_cookie_req = JobDefineSaveCookieRequest {
        job_define_id: id,
        cookie: cookie_res.clone().unwrap_or_default(),
    };

    save_cookie(save_cookie_req)
        .await
        .map_err(|e| e.to_string())?;

    task::run_job(app, task_result)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
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
