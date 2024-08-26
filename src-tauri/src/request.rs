use crate::store;
use core::option::Option;
use log::{debug, error, info};
use reqwest::Client;
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use std::env::var;
use thiserror::Error;

#[derive(Debug, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: T,
}

#[derive(Debug, Error)]
pub enum ApiError {
    #[error("Request failed with status {0}")]
    RequestFailed(reqwest::StatusCode),
    #[error(transparent)]
    ReqwestError(#[from] reqwest::Error),
    #[error("Store access failed")]
    StoreAccessFailed,
    #[error("Token is missing")]
    MissingToken,
    #[error("Failed to deserialize response")]
    DeserializationFailed,
}

impl From<tauri_plugin_store::Error> for ApiError {
    fn from(_err: tauri_plugin_store::Error) -> Self {
        ApiError::StoreAccessFailed
    }
}

pub async fn send_request<T, U>(path: &str, req_body: Option<U>) -> Result<T, ApiError>
where
    T: DeserializeOwned + std::fmt::Debug,
    U: Serialize + std::fmt::Debug,
{
    info!("send_request: {}", path);
    let base_url = var("BASE_URL").unwrap_or_else(|_| {
        let default_url = "https://seajob.snowycat.cn".to_string();
        info!(
            "Environment variable BASE_URL not found. Using default: {}",
            default_url
        );
        default_url
    });

    let url = format!(
        "{}/{}",
        base_url.trim_end_matches('/'),
        path.trim_start_matches('/')
    );
    debug!("Full request URL: {}", url);

    let client = Client::builder()
        .no_proxy() // 禁用代理
        .build()?;

    let token = match store::get("token") {
        Some(serde_json::Value::String(t)) if !t.is_empty() => t,
        _ => return Err(ApiError::MissingToken),
    };
    debug!("Using token: {}", token);

    let mut request = client
        .post(url)
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", token));

    // 如果有请求体，则添加到请求中
    if let Some(body) = req_body {
        debug!("Attaching request body: {:?}", body);
        request = request.json(&body);
    }

    let response = match request.send().await {
        Ok(resp) => {
            debug!("Received response: {:?}", resp);
            resp
        }
        Err(err) => {
            error!("Failed to send request: {:?}", err);
            return Err(ApiError::ReqwestError(err));
        }
    };

    let status = response.status();
    info!("Response status: {}", status);

    let api_response: ApiResponse<T> = match response.json().await {
        Ok(json) => {
            debug!("Deserialized response: {:?}", json);
            json
        }
        Err(err) => {
            error!("Failed to deserialize response: {:?}", err);
            return Err(ApiError::DeserializationFailed);
        }
    };

    if api_response.success {
        info!("Request succeeded");
        Ok(api_response.data)
    } else {
        info!("Request failed with status: {:?}", status);
        Err(ApiError::RequestFailed(status))
    }
}
