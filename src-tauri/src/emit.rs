use app::app_handler::get_app;
use tauri::Manager;
use log::info;

pub fn send_install_log(message: &str) {
  info!("{}", message);
  if let Some(app) = get_app() {
      app.emit_all("install_log", message).unwrap();
  }
}