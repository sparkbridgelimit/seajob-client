use std::sync::OnceLock;
use tauri::AppHandle;

// 定义一个全局的 OnceLock 来保存 AppHandle 单例
static APP_HANDLER: OnceLock<AppHandle<tauri::Wry>> = OnceLock::new();

// 初始化 APP 单例，将 AppHandle 保存到 OnceLock 中
pub fn init_app(app: AppHandle<tauri::Wry>) -> Result<(), &'static str> {
    APP_HANDLER.set(app).map_err(|_| "Failed to initialize APP instance")
}

// 获取 APP 单例，返回 Option<AppHandle>
pub fn get_app() -> Option<&'static AppHandle<tauri::Wry>> {
    APP_HANDLER.get()
}
