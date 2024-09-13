use log::info;
use tauri::Manager;
use crate::app_handler::get_app;

pub fn send_install_log(message: &str) {
  info!("{}", message);
  if let Some(app) = get_app() {
      app.emit_all("install_log", message).unwrap();
  }
}