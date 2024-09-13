// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use crate::command::{
    clear_token, detect_chrome, get_token, install_chrome, run_job_define, set_token, test_bin,
};
use env_logger;
use log::info;
use store::init_store;
use tauri::generate_handler;
use tauri_plugin_store::StoreBuilder;

mod browser;
mod command;
mod fetcher;
mod login;
mod process;
mod request;
mod service;
mod store;
mod task;
mod app_handler;
mod emit;

fn main() {
    // 初始化 env_logger
    env_logger::init();
    // 获取资源目录

    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
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
            install_chrome
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
