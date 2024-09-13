use std::path::PathBuf;

use which::which;

use crate::fetcher::{Fetcher, FetcherOptions, Revision};

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
        use crate::process::get_chrome_path_from_registry;

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

    let v = "1354974";
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
