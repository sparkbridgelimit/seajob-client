use log::info;
use serde::{Deserialize, Serialize};
use crate::request::{ApiError, send_request};

#[derive(Serialize)]
pub struct JobDefineDetailRequest {
    pub job_define_id: i64,
}

#[derive(Debug, Serialize)]
pub struct JobDefineSaveCookieRequest {
    pub job_define_id: i64,
    pub cookie: String
}

#[derive(Debug, Deserialize)]
pub struct JobDefineSaveCookieRes {
    pub success: bool,
}

pub async fn save_cookie(req: JobDefineSaveCookieRequest) -> Result<JobDefineSaveCookieRes, ApiError> {
    info!("保存cookie");
    send_request("/api/s/job_define/cookie", Some(req)).await
}


#[derive(Debug, Serialize)]
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
    info!("create_task");
    // 发送请求并返回结果
    send_request("/api/s/job_define/run", Some(req)).await
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct JobDefineCookieReq {
    // job_define
    pub job_define_id: i64,
}

#[derive(Deserialize, Debug, Clone)]
pub struct JobParamDetailRes {
    // job_define
    pub wt2_cookie: String,
}

/// 查询jobdefine详情
pub async fn get_last_cookie(req: JobDefineCookieReq) -> Result<JobParamDetailRes, ApiError> {
    info!("get_job_define_detail");
    send_request("/api/s/job_define/get_cookie", Some(req)).await
}