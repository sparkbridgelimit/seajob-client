use serde::{Deserialize, Serialize};
use serde_json::json;
use seajob_client::request;
use seajob_client::request::{ApiResponse, send_request};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RunReq {
    pub job_define_id: i64,
    pub target_num: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RunRes {
    pub id: i64,
    pub job_define_id: i64,
    pub status: String,
    pub target_num: i32,
    pub done_num: i32,
    pub last_error: Option<String>,
}


#[tokio::test]
async fn test_request() {
    // 定义请求体
    let req_body = RunReq {
        job_define_id: 579371743748928,
        target_num: 2,
    };

    // 发送请求
    let response: Result<ApiResponse<RunRes>, reqwest::Error> = send_request(
        "http://localhost:8080/seajob/api/s/job_define/run",
        Some(req_body),
    )
    .await;

    // 检查请求结果
    match response {
        Ok(api_response) => {
            assert!(api_response.success, "Request failed: success is false");
            println!("Data: {:?}", api_response.data);
        }
        Err(e) => {
            panic!("Request failed with error: {:?}", e);
        }
    }
}