use std::io::{Error, ErrorKind};
use log::info;
use serde::{Deserialize, Serialize};
use serde::de::StdError;
use crate::request::{ApiError, send_request};

#[derive(Serialize)]
pub struct JobDefineDetailRequest {
    pub job_define_id: i64,
}

#[derive(Serialize)]
pub struct JobDefineSaveCookieRequest {
    pub job_define_id: i64,
    pub cookie: String
}

#[derive(Deserialize)]
pub struct JobDefineSaveCookieRes {
    pub success: bool,
}


pub async fn save_cookie(req: JobDefineSaveCookieRequest) -> Result<bool, Box<dyn StdError>> {
    info!("save_cookie");

    let client = reqwest::Client::builder()
        .no_proxy() // 禁用代理
        .build()?;

    let response = match client
        .post("http://localhost:8080/seajob/api/s/job_define/cookie")
        .header("Content-Type", "application/json")
        .header("x-user-id", "1")
        .json(&serde_json::json!(req))
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => {
            eprintln!("Failed to send request: {}", e);
            return Err(Box::new(e));
        }
    };

    // 捕获并记录获取响应体时的错误
    let response_text = match response.text().await {
        Ok(text) => text,
        Err(e) => {
            eprintln!("Failed to read response body: {}", e);
            return Err(Box::new(e));
        }
    };
    info!("Response body: {:?}", response_text);

    // 解析响应 JSON 并检查 success 字段
    let api_response: JobDefineSaveCookieRes = match serde_json::from_str(&response_text) {
        Ok(json) => json,
        Err(e) => {
            eprintln!("Failed to parse response body as JSON: {:?}", e);
            return Err(Box::new(e));
        }
    };

    if api_response.success {
        Ok(true)
    } else {
        Err(Box::new(Error::new(ErrorKind::Other, "Save cookie fail")))
    }
}


#[derive(Serialize)]
pub struct JobDefineRunRequest {
    pub job_define_id: i64,
    pub target_num: i32,
}

#[derive(Deserialize, Debug, Clone)]
pub struct JobDefineRunRes {
    // job_define
    pub job_define_id: i64,
    // job_prefer
    pub keyword: String,
    pub city_code: String,
    pub salary_range: String,
    pub key_kills: String,
    pub exclude_company: String,
    pub exclude_job: String,
    // job_param
    pub interval: i32,
    pub timeout: i32,
    pub wt2_cookie: String,
    pub hello_text: String,
    // 运行次数
    pub target_num: i32,
}

pub async fn create_task(req: JobDefineRunRequest) -> Result<JobDefineRunRes, ApiError> {
    // 发送请求并返回结果
    send_request("/api/s/job_define/run", Some(req)).await
}