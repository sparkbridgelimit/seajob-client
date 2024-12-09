// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use crate::command::{
    check_boss_cookie, clear_token, clear_user_data_dir, detect_chrome, get_token,
    init_boss_cookie, install_chrome, launch_browser, run_job_define, set_token,
    show_user_data_dir, test_bin,
};
use app::app_handler;
use browser::browser_manager::BrowserManager;
use log::{info, LevelFilter};
use store::init_store;
use tauri::generate_handler;
use tauri_plugin_log::LogTarget;
use tauri_plugin_store::StoreBuilder;

mod command;
mod emit;
mod helper;
mod login;
mod process;
mod request;
mod service;
mod store;
mod task;

fn main() {
    let browser_manager = BrowserManager::default();

    tauri::Builder::default()
        .manage(browser_manager.clone())
        .plugin(tauri_plugin_store::Builder::default().build())
        // 日志初始化
        .plugin(
            tauri_plugin_log::Builder::default()
                .targets([LogTarget::LogDir, LogTarget::Stdout, LogTarget::Webview])
                .level(LevelFilter::Info) // 设置日志级别过滤，Trace 日志不会打印
                .build(),
        )
        // .setup(setup)
        .setup(|app| {
            let _ = app_handler::init_app(app.handle());
            let mut store = StoreBuilder::new(app.handle(), "settings.json".parse()?).build();
            let _ = store.load();

            init_store(store);
            let token = match store::get("token") {
                Some(serde_json::Value::String(t)) if !t.is_empty() => t,
                _ => "".to_string(),
            };
            info!("Using token: {}", token);
            Ok(())
        })
        .invoke_handler(generate_handler![
            run_job_define,
            get_token,
            set_token,
            clear_token,
            detect_chrome,
            test_bin,
            install_chrome,
            check_boss_cookie,
            init_boss_cookie,
            clear_user_data_dir,
            launch_browser,
            show_user_data_dir
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
