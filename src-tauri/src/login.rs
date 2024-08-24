use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use log::info;
use std::fs::File;
use std::io::{BufReader, BufWriter};
use reqwest::{Client, ClientBuilder, header::{HeaderMap, HeaderValue, USER_AGENT}};
use reqwest_cookie_store::{CookieStore, CookieStoreMutex};
use serde_json::Value;
use uuid::Uuid;
use once_cell::sync::Lazy;
use std::error::{Error as StdError, Error};

#[derive(Deserialize)]
struct RandKeyResponse {
    zpData: Option<ZpData>,
}

#[derive(Deserialize)]
struct ZpData {
    #[warn(non_snake_case)]
    qrId: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct Cookie {
    name: String,
    value: String,
}

static COOKIE_STORE: Lazy<Arc<CookieStoreMutex>> = Lazy::new(|| {
    let store = match File::open("cookies.json").map(BufReader::new) {
        Ok(file) => {
            // 从文件加载 cookie store
            CookieStoreMutex::new(CookieStore::load_json(file).expect("Failed to load cookies from file"))
        }
        Err(_) => {
            // 如果文件不存在，则创建新的 cookie store
            CookieStoreMutex::new(CookieStore::default())
        }
    };
    Arc::new(store)
});

static CLIENT: Lazy<Client> = Lazy::new(|| {
    get_client()
});

pub fn get_client() -> Client {
    let mut headers = HeaderMap::new();
    headers.insert("authority", HeaderValue::from_static("www.zhipin.com"));
    headers.insert("accept", HeaderValue::from_static("application/json, text/plain, */*"));
    headers.insert("accept-language", HeaderValue::from_static("zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7,pt;q=0.6,it;q=0.5"));
    headers.insert("origin", HeaderValue::from_static("https://www.zhipin.com"));
    headers.insert("referer", HeaderValue::from_static("https://www.zhipin.com/web/user/?ka=header-login"));
    headers.insert("sec-ch-ua", HeaderValue::from_static("\"Chromium\";v=\"112\", \"Google Chrome\";v=\"112\", \"Not:A-Brand\";v=\"99\""));
    headers.insert("sec-ch-ua-mobile", HeaderValue::from_static("?0"));
    headers.insert("sec-ch-ua-platform", HeaderValue::from_static("\"macOS\""));
    headers.insert("sec-fetch-dest", HeaderValue::from_static("empty"));
    headers.insert("sec-fetch-mode", HeaderValue::from_static("cors"));
    headers.insert("sec-fetch-site", HeaderValue::from_static("same-origin"));
    headers.insert("traceid", HeaderValue::from_str(&Uuid::new_v4().to_string().to_uppercase()).unwrap());
    headers.insert("token", HeaderValue::from_static("aPdIsoD14hveVnz"));
    headers.insert(USER_AGENT, HeaderValue::from_static("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"));

    ClientBuilder::new()
        .no_proxy()
        .default_headers(headers)
        .cookie_provider(COOKIE_STORE.clone())
        .build()
        .expect("Failed to build client")
}

pub async fn get_randkey() -> Result<String, reqwest::Error> {
    info!("获取随机key");
    let url = "https://www.zhipin.com/wapi/zppassport/captcha/randkey";
    let response = CLIENT.post(url).send().await?;
    let json_data: RandKeyResponse = response.json().await?;
    Ok(json_data.zpData.unwrap().qrId.unwrap())
}

pub async fn wait_qrcode_scan(uuid: &str) -> Result<bool, reqwest::Error> {
    info!("等待扫码: {}", uuid);
    let url = format!("https://www.zhipin.com/wapi/zppassport/qrcode/scan?uuid={}", uuid);
    let response = CLIENT.get(&url).send().await?;
    info!("Response Status: {}", response.status());
    let json_response: Value = response.json().await?;
    info!("Response Body: {}", json_response);
    Ok(json_response["scaned"].as_bool().unwrap_or(false))
}

pub async fn get_second_key(uuid: &str) -> Result<String, reqwest::Error> {
    info!("获取二次key: {}", uuid);
    let url = format!("https://www.zhipin.com/wapi/zppassport/captcha/getSecondKey?uuid={}", uuid);
    let response = CLIENT.get(&url).send().await?;
    let json_response: Value = response.json().await?;
    let qr_id = json_response["zpData"]["qrId"].as_str().unwrap().to_string();
    Ok(qr_id)
}

pub async fn scan_second_qrcode(uuid: &str) -> Result<bool, reqwest::Error> {
    info!("扫描二维码: {}", uuid);
    let url = format!("https://www.zhipin.com/wapi/zppassport/qrcode/scanSecond?uuid={}", uuid);
    let response = CLIENT.get(&url).send().await?;
    info!("Response Status: {}", response.status());
    let json_response: Value = response.json().await?;
    info!("Response Body: {}", json_response);
    Ok(json_response["scaned"].as_bool().unwrap_or(false))
}

pub async fn wait_confirm(uuid: &str) -> Result<bool, reqwest::Error> {
    info!("等待确认: {}", uuid);
    let url = format!("https://www.zhipin.com/wapi/zppassport/qrcode/scanLogin?qrId={}", uuid);
    let response = CLIENT.get(&url).send().await?;
    info!("{}", response.text().await?);
    Ok(true)
}

pub fn save_cookie_store() -> Result<(), Box<dyn StdError + Send + Sync>> {
    let store = COOKIE_STORE.lock().unwrap();
    let mut writer = File::create("cookies.json")
        .map(BufWriter::new)
        .unwrap();
    store.save_json(&mut writer).unwrap();
    Ok(())
}

pub async fn dispatch_qrcode(uuid: &str) -> Result<HashMap<String, String>, reqwest::Error> {
    info!("分发二维码: {}", uuid);
    let url = format!("https://www.zhipin.com/wapi/zppassport/qrcode/dispatcher?qrId={}", uuid);
    let response = CLIENT.get(&url).send().await?;

    // Clone response for text and cookies separately
    let text_response = response.text().await?;
    info!("Text response: {}", text_response);

    let cookies: HashMap<String, String> = COOKIE_STORE
        .lock()
        .unwrap()
        .iter_any()
        .map(|cookie| (cookie.name().to_string(), cookie.value().to_string()))
        .collect();

    info!("Cookies: {:?}", cookies);

    Ok(cookies)
}

#[derive(Deserialize, Debug)]
struct BossResponse {
    code: i64,
}

pub async fn check_auth(wt2: &str) -> Result<bool, Box<dyn Error>> {
    info!("check_auth: {}", wt2);
    let cookie_value = format!("wt2={};", wt2);

    let response = get_client()
        .get("https://www.zhipin.com/wapi/zpitem/geek/vip/info?")
        .header(reqwest::header::COOKIE, cookie_value)
        .send()
        .await?;

    let response_text = response.text().await?;
    info!("{}", response_text);
    let api_response: BossResponse = serde_json::from_str(&response_text)?;
    Ok(api_response.code == 0)
}