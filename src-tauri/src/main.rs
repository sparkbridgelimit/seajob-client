// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::env;

use env_logger;
use tauri::{generate_handler, Manager};
use crate::command::{run_job_define};
use crate::store::{setup};

mod command;
mod login;
mod service;
mod task;
mod request;
mod store;

fn main() {
    // 初始化 env_logger
    env_logger::init();
    // 获取资源目录

    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(setup)
        .invoke_handler(generate_handler![run_job_define])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
