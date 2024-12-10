use app::app_handler::get_app;
use std::path::PathBuf;
use std::process::Stdio;
use which::which;

use crate::{
    browser::LaunchParams,
    fetcher::{Fetcher, FetcherOptions, Revision},
};
use log::error;
use serde_json::Value;
use tokio::process::Command;

/// 获取用户数据目录。
///
/// # 参数
///
/// * `account_id` - 用户的账户 ID。
///
/// # 返回
///
/// * `Result<PathBuf, Box<dyn std::error::Error>>` - 返回用户数据目录的路径或错误信息。
pub fn get_user_data_dir(id: &str) -> Result<PathBuf, Box<dyn std::error::Error>> {
    // 获取全局的 AppHandle
    let app_handle: &tauri::AppHandle = get_app().ok_or("AppHandle 未初始化")?;

    // 获取应用数据目录
    let app_data_dir = app_handle.path_resolver().app_data_dir().ok_or_else(|| "Failed to resolve resource".to_string())?;

    // 构建用户目录路径
    let user_dir = app_data_dir.join("user_cache").join(id);

    // 确保用户目录存在
    std::fs::create_dir_all(&user_dir).map_err(|e| format!("无法创建用户数据目录: {}", e))?;

    Ok(user_dir)
}

/// 根据操作系统和架构选择相应的二进制文件名称。
///
/// # 返回
///
/// * `Result<&'static str, String>` - 返回二进制文件名称或错误信息。
pub fn get_binary_name() -> Result<&'static str, String> {
    match (std::env::consts::OS, std::env::consts::ARCH) {
        ("windows", _) => Ok("resources/seajob-executor-windows-x64.exe"),
        ("macos", "x86_64") => Ok("resources/seajob-executor-macos-x64"),
        ("macos", "aarch64") => Ok("resources/seajob-executor-macos-arm64"),
        _ => Err("不支持的操作系统或架构".to_string()),
    }
}

/// 序列化启动参数为 JSON 字符串。
///
/// # 参数
///
/// * `user_data_dir` - 用户数据目录的路径。
/// * `chrome_path` - Chrome 浏览器的路径。
///
/// # 返回
///
/// * `Result<String, String>` - 返回序列化后的 JSON 字符串或错误信息。
pub fn prepare_launch_params(
    user_data_dir: &PathBuf,
    chrome_path: &str,
    task: &str,
    payload: Value,
    headless: bool,
    auto_close: bool,
) -> Result<String, String> {
    let params = LaunchParams {
        user_data_dir: user_data_dir.to_string_lossy().to_string(),
        chrome_path: chrome_path.to_string(),
        task: task.to_string(),
        payload,
        headless,
        auto_close,
    };

    serde_json::to_string(&params).map_err(|e| e.to_string())
}

/// Returns the path to Chrome's executable.
///
/// If the `CHROME` environment variable is set, `default_executable` will
/// use it as the default path. Otherwise, the filenames `google-chrome-stable`
/// `chromium`, `chromium-browser`, `chrome` and `chrome-browser` are
/// searched for in standard places. If that fails,
/// `/Applications/Google Chrome.app/...` (on MacOS) or the registry (on Windows)
/// is consulted. If all of the above fail, an error is returned.
pub fn default_executable() -> Result<std::path::PathBuf, String> {
    if let Ok(path) = std::env::var("CHROME") {
        if std::path::Path::new(&path).exists() {
            return Ok(path.into());
        }
    }

    for app in &[
        "google-chrome-stable",
        "google-chrome-beta",
        "google-chrome-dev",
        "google-chrome-unstable",
        "chromium",
        "chromium-browser",
        "microsoft-edge-stable",
        "microsoft-edge-beta",
        "microsoft-edge-dev",
        "chrome",
        "chrome-browser",
        "msedge",
        "microsoft-edge",
    ] {
        if let Ok(path) = which(app) {
            return Ok(path);
        }
    }

    #[cfg(target_os = "macos")]
    {
        for path in &[
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta",
            "/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev",
            "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
            "/Applications/Chromium.app/Contents/MacOS/Chromium",
            "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
            "/Applications/Microsoft Edge Beta.app/Contents/MacOS/Microsoft Edge Beta",
            "/Applications/Microsoft Edge Dev.app/Contents/MacOS/Microsoft Edge Dev",
            "/Applications/Microsoft Edge Canary.app/Contents/MacOS/Microsoft Edge Canary",
        ][..]
        {
            if std::path::Path::new(path).exists() {
                return Ok(path.into());
            }
        }
    }

    #[cfg(windows)]
    {

        if let Some(path) = get_chrome_path_from_registry() {
            if path.exists() {
                return Ok(path);
            }
        }

        for path in &[r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"][..] {
            if std::path::Path::new(path).exists() {
                return Ok(path.into());
            }
        }
    }

    Err("Could not auto detect a chrome executable".to_string())
}

/// 获取 Chrome 的启动路径：先尝试默认路径，再使用 Fetcher 检测安装的路径。
pub fn get_launch_path() -> Result<PathBuf, String> {
    // 先尝试使用 default_executable
    match default_executable() {
        Ok(path) => {
            println!("Using system Chrome: {:?}", path);
            return Ok(path);
        }
        Err(e) => {
            println!("System Chrome not found, attempting to use Fetcher to check installed Chrome. Error: {}", e);
        }
    }
    #[allow(unused_assignments)]
    let mut v: &str = "";
    #[cfg(windows)]
    {
        v = "1355004"
    }

    #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
    {
        v = "1355021"
    }

    #[cfg(all(target_os = "macos", not(target_arch = "aarch64")))]
    {
        v = "1355028"
    }

    let rev = Revision::Specific(v.to_string());
    let fetcher_options = FetcherOptions::default()
        .with_revision(rev.clone())
        .with_allow_download(false); // 允许下载

    // 创建 Fetcher 实例
    let fetcher = Fetcher::new(fetcher_options);
    // 使用 Fetcher 检查指定版本的 Chrome 是否已安装
    match fetcher.chrome_path(v) {
        Ok(path) => {
            println!("Using fetched Chrome: {:?}", path);
            return Ok(path);
        }
        Err(e) => {
            let error_msg = format!("Chrome version {} not found via Fetcher. Error: {}", v, e);
            println!("{}", error_msg);
            return Err(error_msg);
        }
    }
}

pub fn get_bee_headless_path() -> Result<PathBuf, String> {
    let app = get_app().ok_or_else(|| "AppHandle 未初始化".to_string())?;

    // 获取二进制文件名称
    let binary_name = get_binary_name()?;

    app.path_resolver()
        .resolve_resource(binary_name)
        .ok_or_else(|| "Failed to resolve resource".to_string())
}

/// 启动子进程，并传递 JSON 参数。
///
/// # 参数
///
/// * `executor_path` - 二进制文件的路径。
/// * `json_params` - 序列化后的 JSON 参数。
///
/// # 返回
///
/// * `Result<tokio::process::Child, String>` - 返回子进程或错误信息。
pub async fn launch_subprocess(
    executor_path: &PathBuf,
    json_params: String,
) -> Result<tokio::process::Child, String> {
    Command::new(executor_path)
        .arg(json_params)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| {
            let err_msg = format!("无法启动进程: {}", e);
            error!("{}", err_msg);
            err_msg
        })
}

#[cfg(windows)]
use winreg::{enums::HKEY_LOCAL_MACHINE, RegKey};

#[cfg(windows)]
pub(crate) fn get_chrome_path_from_registry() -> Option<std::path::PathBuf> {
    RegKey::predef(HKEY_LOCAL_MACHINE)
        .open_subkey("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe")
        .and_then(|key| key.get_value::<String, _>(""))
        .map(std::path::PathBuf::from)
        .ok()
}