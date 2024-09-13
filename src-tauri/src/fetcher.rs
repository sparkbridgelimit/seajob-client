use std::{
    fs::{self, OpenOptions},
    io::{self, Write},
    path::{Path, PathBuf},
    str::FromStr,
    time::{Duration, Instant},
};

#[cfg(not(target_os = "macos"))]
use std::fs::File;
#[cfg(not(target_os = "macos"))]
use std::io::BufWriter;

use anyhow::{anyhow, Result};
use directories::ProjectDirs;
use log::*;
use ureq;
use walkdir::WalkDir;
#[cfg(not(target_os = "macos"))]
use zip;

use crate::emit::send_install_log;

pub const CUR_REV: &str = "1095492";

const APP_NAME: &str = "headless-chrome";
const DEFAULT_HOST: &str = "https://googleapis-proxy.aleksiwork.com";

#[cfg(target_os = "linux")]
const PLATFORM: &str = "linux";
#[cfg(all(target_os = "macos", target_arch = "aarch64"))]
const PLATFORM: &str = "mac_arm";
#[cfg(all(target_os = "macos", not(target_arch = "aarch64")))]
const PLATFORM: &str = "mac";
#[cfg(windows)]
const PLATFORM: &str = "win";

#[derive(Clone, Debug)]
pub enum Revision {
    Specific(String),
    #[allow(dead_code)]
    Latest,
}

#[derive(Clone, Debug)]
pub struct FetcherOptions {
    /// The desired chrome revision.
    ///
    /// defaults to CUR_REV
    revision: Revision,

    /// The prefered installation directory. If not None we will look here first
    /// for existing installs.
    ///
    /// defaults to None
    install_dir: Option<PathBuf>,

    /// Allow headless_chrome to download and install the desired revision if not found.
    ///
    /// defaults to true
    allow_download: bool,

    /// Allow looking in the standard installation directories for existing installs.
    ///
    /// defaults to true
    allow_standard_dirs: bool,
}

impl Default for FetcherOptions {
    fn default() -> Self {
        Self {
            revision: Revision::Specific(CUR_REV.into()),
            install_dir: None,
            allow_download: true,
            allow_standard_dirs: true,
        }
    }
}

impl FetcherOptions {
    #[must_use]
    pub fn with_revision(mut self, revision: Revision) -> Self {
        self.revision = revision;
        self
    }
    #[must_use]
    pub fn with_install_dir<P: Into<PathBuf>>(mut self, install_dir: Option<P>) -> Self {
        match install_dir {
            Some(dir) => self.install_dir = Some(dir.into()),
            None => self.install_dir = None,
        }
        self
    }
    #[must_use]
    pub fn with_allow_download(mut self, allow_download: bool) -> Self {
        self.allow_download = allow_download;
        self
    }
    #[must_use]
    pub fn with_allow_standard_dirs(mut self, allow_standard_dirs: bool) -> Self {
        self.allow_standard_dirs = allow_standard_dirs;
        self
    }
}

#[derive(Default)]
pub struct Fetcher {
    options: FetcherOptions,
}

impl Fetcher {
    pub fn new(options: FetcherOptions) -> Self {
        Self { options }
    }

    // look for good existing installation, if none exists then download and install
    pub fn fetch(&self) -> Result<PathBuf> {
        let rev = match self.options.revision {
            Revision::Specific(ref v) => v.to_string(),
            Revision::Latest => latest_revision()?,
        };

        if let Ok(chrome_path) = self.chrome_path(&rev) {
            send_install_log("Chrome已经安装了, 不需要重复安装");
            return Ok(chrome_path);
        }

        if self.options.allow_download {
            let zip_path = self.download(&rev)?;

            Fetcher::unzip(zip_path)?;

            // look again
            return self.chrome_path(&rev);
        }

        // couldn't find and not allowed to download
        Err(anyhow!("Could not fetch"))
    }

    // Look for an installation directory matching self.options.revision
    fn base_path(&self, revision: &str) -> Result<PathBuf> {
        // we want to look in install_dir first, then data dir
        let mut search_dirs: Vec<&Path> = Vec::new();
        let project_dirs = get_project_dirs()?;
        if let Some(install_dir) = &self.options.install_dir {
            search_dirs.push(install_dir.as_path());
        }
        if self.options.allow_standard_dirs {
            search_dirs.push(project_dirs.data_dir());
        }

        for root_dir in search_dirs {
            for entry in WalkDir::new(root_dir).into_iter().filter_map(Result::ok) {
                // filename is formatted as `{PLATFORM}-{REVISION}`
                let filename_parts = entry
                    .file_name()
                    .to_str()
                    .ok_or_else(|| anyhow!("Failed conversion to UTF-8"))?
                    .split('-')
                    .collect::<Vec<_>>();

                if filename_parts.len() == 2
                    && filename_parts[0] == PLATFORM
                    && filename_parts[1] == revision
                {
                    return Ok(entry.path().into());
                }
            }
        }

        Err(anyhow!("Could not find an existing revision"))
    }

    // find full path to chrome executable from base_path
    pub fn chrome_path(&self, revision: &str) -> Result<PathBuf> {
        let mut path = self.base_path(revision)?;
        path.push(archive_name(revision));

        #[cfg(target_os = "linux")]
        {
            path.push("chrome");
        }
        #[cfg(target_os = "macos")]
        {
            path.push("Chromium.app");
            path.push("Contents");
            path.push("MacOS");
            path.push("Chromium");
        }
        #[cfg(windows)]
        {
            path.push("chrome.exe");
        }

        Ok(path)
    }

    // download a .zip of the revision we want
    fn download(&self, revision: &str) -> Result<PathBuf> {
        let url = dl_url(revision);
        send_install_log(&format!("安装URL: {url}"));

        // 获取文件大小并记录总大小
        let total_size = get_size(&url)? * 2_u64.pow(20); // 将 MiB 转为字节
        send_install_log(&format!(
            "总下载大小: {:.2} MiB",
            total_size as f64 / 2_u64.pow(20) as f64
        ));

        // 确定安装路径
        let mut path: PathBuf = if let Some(mut dir) = self.options.install_dir.clone() {
            dir.push(format!("{PLATFORM}-{revision}"));
            send_install_log(&format!("安装目录: {}", dir.display()));
            dir
        } else if self.options.allow_standard_dirs {
            let mut dir = get_project_dirs()?.data_dir().to_path_buf();
            dir.push(format!("{PLATFORM}-{revision}"));
            send_install_log(&format!("使用默认的安装目录: {}", dir.display()));
            dir
        } else {
            send_install_log(&format!("该目录无法安装"));
            return Err(anyhow!("No allowed installation directory"));
        };

        // 设置 zip 文件路径
        path = path.with_extension("zip");
        send_install_log(&format!("安装包路径: {}", path.display()));

        // 确保安装目录存在
        fs::create_dir_all(
            path.parent()
                .ok_or_else(|| anyhow!("Path {:?} does not have a parent directory", path))?,
        )
        .map_err(|_err| anyhow!("Could not create directory at {:?}", path.parent()))?;

        send_install_log(&format!("创建文件: {}", &path.display()));
        let mut file = OpenOptions::new()
            .create(true)
            .truncate(true)
            .write(true)
            .open(&path)?;

        // 开始下载并显示进度
        let resp = ureq::get(&url).call()?;
        let mut reader = resp.into_reader();

        const CHUNK_SIZE: usize = 1024 * 1024; // 每次读取 1MB
        let mut buffer = vec![0; CHUNK_SIZE];
        let mut bytes_downloaded: u64 = 0;

        let mut last_log_time = Instant::now(); // 记录最后一次日志输出的时间
        let log_interval = Duration::from_secs(1); // 每 1 秒输出一次日志

        loop {
            let bytes_read = reader.read(&mut buffer)?;
            if bytes_read == 0 {
                break;
            }
            file.write_all(&buffer[..bytes_read])?;
            bytes_downloaded += bytes_read as u64;

            // 判断距离上次日志输出是否超过 1 秒
            if last_log_time.elapsed() >= log_interval {
                let percentage = (bytes_downloaded as f64 / total_size as f64) * 100.0;
                send_install_log(&format!("下载中... {:.2}%", percentage));
                io::stdout().flush().unwrap();

                // 更新最后一次日志输出的时间
                last_log_time = Instant::now();
            }
        }

        send_install_log(&format!("全部下载完成"));
        send_install_log(&format!("文件下载到: {}", path.display()));
        Ok(path)
    }

    #[cfg(target_os = "macos")]
    fn do_unzip<P: AsRef<Path>>(zip_path: P, extract_path: &Path) -> Result<()> {
        let out = std::process::Command::new("unzip")
            .arg(zip_path.as_ref().as_os_str())
            .current_dir(extract_path)
            .output()?;

        if !out.status.success() {
            error!(
                "Unable to extract zip using unzip command: \n---- stdout:\n{}\n---- stderr:\n{}",
                String::from_utf8_lossy(&out.stdout),
                String::from_utf8_lossy(&out.stderr)
            );
        }
        Ok(())
    }

    #[cfg(not(target_os = "macos"))]
    fn do_unzip<P: AsRef<Path>>(zip_path: P, extract_path: &Path) -> Result<()> {
        let mut archive = zip::ZipArchive::new(File::open(zip_path.as_ref())?)?;

        for i in 0..archive.len() {
            let mut file = archive.by_index(i)?;
            let mut out_path = PathBuf::from(extract_path);
            out_path.push(file.mangled_name().as_path());

            let comment = file.comment();
            if !comment.is_empty() {
                trace!("File {} comment: {}", i, comment);
            }

            if (file.name()).ends_with('/') {
                trace!(
                    "File {} extracted to \"{}\"",
                    i,
                    out_path.as_path().display()
                );
                fs::create_dir_all(&out_path)?;
            } else {
                trace!(
                    "File {} extracted to \"{}\" ({} bytes)",
                    i,
                    out_path.as_path().display(),
                    file.size()
                );
                if let Some(p) = out_path.parent() {
                    if !p.exists() {
                        fs::create_dir_all(p)?;
                    }
                }
                let mut out_file = BufWriter::new(File::create(&out_path)?);
                io::copy(&mut file, &mut out_file)?;
            }
            // Get and Set permissions
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;

                if let Some(mode) = file.unix_mode() {
                    fs::set_permissions(&out_path, fs::Permissions::from_mode(mode))?;
                }
            }
        }
        Ok(())
    }
    // unzip the downloaded file and do all the needed file manipulation
    fn unzip<P: AsRef<Path>>(zip_path: P) -> Result<PathBuf> {
        let mut extract_path: PathBuf = zip_path
            .as_ref()
            .parent()
            .ok_or_else(|| anyhow!("zip_path does not have a parent directory"))?
            .to_path_buf();

        let folder_name = zip_path
            .as_ref()
            .file_stem()
            .ok_or_else(|| anyhow!("zip_path does not have a file stem"))?;

        extract_path.push(folder_name);

        fs::create_dir_all(&extract_path)?;

        send_install_log(&format!("解压中, 需要一点时间: {}", extract_path.display()));

        Fetcher::do_unzip(zip_path.as_ref(), &extract_path)?;

        send_install_log(&format!("清理安装文件中"));
        if fs::remove_file(&zip_path).is_err() {
            info!("Failed to delete zip");
            return Ok(extract_path);
        }

        Ok(extract_path)
    }
}

fn get_size<U: AsRef<str>>(url: U) -> Result<u64> {
    let resp = ureq::get(url.as_ref()).call();
    match resp?.header("Content-Length") {
        Some(len) => Ok(u64::from_str(len)? / 2_u64.pow(20)),
        None => Err(anyhow!("response doesn't include the content length")),
    }
}

fn get_project_dirs() -> Result<ProjectDirs> {
    info!("Getting project dir");
    match ProjectDirs::from("", "", APP_NAME) {
        Some(dirs) => Ok(dirs),
        None => Err(anyhow!("Failed to retrieve project dirs")),
    }
}

fn dl_url<R>(revision: R) -> String
where
    R: AsRef<str>,
{
    #[cfg(target_os = "linux")]
    {
        format!(
            "{}/chromium-browser-snapshots/Linux_x64/{}/{}.zip",
            DEFAULT_HOST,
            revision.as_ref(),
            archive_name(revision.as_ref())
        )
    }

    #[cfg(all(target_os = "macos", not(target_arch = "aarch64")))]
    {
        format!(
            "{}/chromium-browser-snapshots/Mac/{}/{}.zip",
            DEFAULT_HOST,
            revision.as_ref(),
            archive_name(revision.as_ref())
        )
    }

    #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
    {
        format!(
            "{}/chromium-browser-snapshots/Mac_Arm/{}/{}.zip",
            DEFAULT_HOST,
            revision.as_ref(),
            archive_name(revision.as_ref())
        )
    }

    #[cfg(windows)]
    {
        format!(
            "{}/chromium-browser-snapshots/Win_x64/{}/{}.zip",
            DEFAULT_HOST,
            revision.as_ref(),
            archive_name(revision.as_ref())
        )
    }
}

fn archive_name<R: AsRef<str>>(revision: R) -> &'static str {
    #[cfg(target_os = "linux")]
    {
        drop(revision);

        "chrome-linux"
    }

    #[cfg(target_os = "macos")]
    {
        drop(revision);

        "chrome-mac"
    }

    #[cfg(windows)]
    {
        // Windows archive name changed at r591479.
        if revision.as_ref().parse::<u32>().ok() > Some(591_479) {
            "chrome-win"
        } else {
            "chrome-win32"
        }
    }
}

// Returns the latest chrome revision for the current platform.
// This function will panic on unsupported platforms.
fn latest_revision() -> Result<String> {
    let mut url = format!("{DEFAULT_HOST}/chromium-browser-snapshots");

    #[cfg(target_os = "linux")]
    {
        url = format!("{url}/Linux_x64/LAST_CHANGE");
        ureq::get(&url)
            .call()?
            .into_string()
            .map_err(anyhow::Error::from)
    }

    #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
    {
        url = format!("{url}/Mac_Arm/LAST_CHANGE");
        ureq::get(&url)
            .call()?
            .into_string()
            .map_err(anyhow::Error::from)
    }

    #[cfg(all(target_os = "macos", not(target_arch = "aarch64")))]
    {
        url = format!("{url}/Mac/LAST_CHANGE");
        ureq::get(&url)
            .call()?
            .into_string()
            .map_err(anyhow::Error::from)
    }

    #[cfg(windows)]
    {
        url = format!("{url}/Win_x64/LAST_CHANGE");
        ureq::get(&url)
            .call()?
            .into_string()
            .map_err(anyhow::Error::from)
    }
}
