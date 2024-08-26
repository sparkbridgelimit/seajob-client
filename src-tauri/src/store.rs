use serde_json::{json, Value};
use std::sync::Mutex;
use tauri::Wry;
use tauri_plugin_store::Store;

use std::sync::OnceLock;

static STORE: OnceLock<Mutex<Store<Wry>>> = OnceLock::new();

// 初始化 STORE
pub fn init_store(store: Store<Wry>) {
    // 只初始化一次
    STORE.set(Mutex::new(store)).expect("Failed to initialize STORE");
}

// 获取 STORE 的引用
pub fn get_store() -> &'static Mutex<Store<Wry>> {
    STORE.get().expect("STORE is not initialized")
}

/// 自动保存的 set 函数
pub fn set(key: &str, value: String) -> Result<(), String> {
    let store = get_store();
    let mut store = store.lock().map_err(|e| format!("Failed to lock store: {}", e))?;
    
    store.insert(key.to_string(), json!(value)).map_err(|e| format!("Failed to insert value: {}", e))?;
    store.save().map_err(|e| format!("Failed to save store: {}", e))?;
    
    Ok(())
}

/// 从 Store 中获取值的 get 函数
pub fn get(key: &str) -> Option<Value> {
    let store = get_store();
    let store = store.lock().ok()?;
    
    store.get(key).cloned()
}

pub fn delete(key: &str) -> Result<(), String> {
    let store = get_store();
    let mut store = store.lock().map_err(|e| format!("Failed to lock store: {}", e))?;
    
    store.delete(key).map_err(|e| format!("Failed to remove value: {}", e))?;
    store.save().map_err(|e| format!("Failed to save store: {}", e))?;
    
    Ok(())
}