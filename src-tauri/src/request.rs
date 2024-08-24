use core::option::Option;
use std::env::var;
use reqwest::Client;
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use tauri::Manager;
use tauri_plugin_store::{StoreCollection, with_store};
use thiserror::Error;
use crate::store::get_app_handle;

#[derive(Debug, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: T,
}

fn get_user_id() -> Option<String> {
    return Some(String::from("1"));
}

#[derive(Debug, Error)]
pub enum ApiError {
    #[error("Request failed with status {0}")]
    RequestFailed(reqwest::StatusCode),
    #[error(transparent)]
    ReqwestError(#[from] reqwest::Error),
    #[error("Store access failed")]
    StoreAccessFailed(),
}

impl From<tauri_plugin_store::Error> for ApiError {
    fn from(_err: tauri_plugin_store::Error) -> Self {
        ApiError::StoreAccessFailed()
    }
}


pub async fn send_request<T, U>(path: &str, req_body: Option<U>) -> Result<T, ApiError>
where
    T: DeserializeOwned,
    U: Serialize,
{
    let app = get_app_handle(); // 获取全局 AppHandle
    let base_url = var("BASE_URL").unwrap_or_else(|_| "https://seajob.snowycat.cn".to_string());
    let url = format!("{}/{}", base_url.trim_end_matches('/'), path.trim_start_matches('/'));

    let store_path = "settings.json"; // 存储文件的路径

    // 使用 with_store 获取 token
    let token = with_store(
        app.clone(),
        app.state::<StoreCollection<tauri::Wry>>(),
        &store_path,
        |store| {
            store
                .get("appSettings.token")
                .and_then(|v| v.as_str().map(|s| s.to_string()))
                .ok_or(tauri_plugin_store::Error::NotFound("asd".parse().unwrap())) // 如果没有找到token，返回错误
        },
    )
        .map_err(ApiError::from)?; // 映射到 ApiError

    let client = Client::builder()
        .no_proxy() // 禁用代理
        .build()?;

    let mut request = client
        .post(url)
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", token));

    // 如果有请求体，则添加到请求中
    if let Some(body) = req_body {
        request = request.json(&body);
    }

    let response = request.send().await?;
    let status = response.status();
    let api_response: ApiResponse<T> = response.json().await?;

    if api_response.success {
        Ok(api_response.data)
    } else {
        Err(ApiError::RequestFailed(status))
    }
}

