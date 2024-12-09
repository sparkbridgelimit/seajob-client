// browser_manager.rs

use log::{error, info};
use serde_json::Value;
use std::collections::HashMap;
use std::sync::Arc;
use tauri::async_runtime;
use tokio::sync::{mpsc, Mutex};

use crate::browser::{Browser, BrowserInfo};

/// 管理所有用户的浏览器实例
pub struct BrowserManager {
    /// 用户 ID 与浏览器实例的映射
    pub browsers: Arc<Mutex<HashMap<String, Arc<Mutex<Browser>>>>>,
    /// 发送退出通知的通道
    exit_sender: mpsc::Sender<String>,
}

impl Clone for BrowserManager {
    fn clone(&self) -> Self {
        Self {
            browsers: Arc::clone(&self.browsers),
            exit_sender: self.exit_sender.clone(),
        }
    }
}

impl Default for BrowserManager {
    fn default() -> Self {
        let (tx, mut rx) = mpsc::channel::<String>(100);
        let browsers = Arc::new(Mutex::new(HashMap::new()));

        let manager = Self {
            browsers: browsers.clone(),
            exit_sender: tx.clone(),
        };

        let browsers_clone = browsers.clone();

        async_runtime::spawn(async move {
            while let Some(id) = rx.recv().await {
                let mut browsers = browsers_clone.lock().await;
                if browsers.remove(&id).is_some() {
                    info!("浏览器实例 {} 已从管理器中移除", id);
                } else {
                    error!("尝试移除不存在的浏览器实例 {}", id);
                }
            }
        });

        manager
    }
}

impl BrowserManager {
    /// 启动一个新的浏览器实例并添加到管理中，幂等性保证
    pub async fn start(
        &self,
        id: String,
        task: String,
        payload: Value,
        headless: bool,
        auto_close: bool,
    ) -> Result<BrowserInfo, String> {
        // 提前检查是否已存在
        {
            let browsers = self.browsers.lock().await;
            if browsers.contains_key(&id) {
                return Err(format!("用户 {} 的浏览器已在运行", id));
            }
        }

        // 创建 Browser 实例
        let exit_sender = self.exit_sender.clone();
        let browser = Browser::new(&id, &task, payload, headless, auto_close, &exit_sender)
            .await
            .map_err(|e| {
                error!("创建 Browser 实例失败: {}", e);
                e.to_string()
            })?;
        let browser_arc = Arc::new(Mutex::new(browser));

        // 启动浏览器
        browser_arc.lock().await.launch().await.map_err(|e| {
            error!("启动浏览器失败: {}", e);
            e
        })?;

        // 插入到管理器
        let mut browsers = self.browsers.lock().await;
        browsers.insert(id.clone(), browser_arc.clone());

        let browser_info = {
            let browser = browser_arc.lock().await;
            BrowserInfo {
                id: browser.id.clone(),
                user_data_dir: browser.user_data_dir.to_string_lossy().to_string(),
                task: browser.task.clone(),
                headless: browser.headless,
                auto_close: browser.auto_close,
            }
        };
        Ok(browser_info)
    }

    /// 主动停止指定用户的浏览器实例并移除
    pub async fn stop(&self, id: &str) -> Result<(), String> {
        let mut browsers = self.browsers.lock().await;

        // 先取出浏览器实例以避免多次可变借用
        let browser = if let Some(browser) = browsers.remove(id) {
            browser
        } else {
            return Err(format!("未找到用户 {} 的浏览器实例", id));
        };

        // 在锁外操作以避免借用冲突
        let mut browser = browser.lock().await;
        if browser.is_running() {
            browser.stop().await?;
            Ok(())
        } else {
            Err(format!("用户 {} 的浏览器未运行", id))
        }
    }

    /// 获取所有运行中的浏览器实例
    pub async fn list(&self) -> Vec<BrowserInfo> {
        let browsers = self.browsers.lock().await;
        let mut info_list = Vec::new();

        for b in browsers.values() {
            let b = b.lock().await;
            info_list.push(BrowserInfo {
                id: b.id.clone(),
                user_data_dir: b.user_data_dir.clone().to_string_lossy().to_string(),
                task: b.task.clone(),
                headless: b.headless,
                auto_close: b.auto_close,
            });
        }

        info_list
    }
}
