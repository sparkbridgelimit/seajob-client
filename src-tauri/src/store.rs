use std::sync::Mutex;
use tauri::{App, Manager, Wry};
use tauri_plugin_store::{Store, StoreBuilder, StoreCollection};


use std::sync::OnceLock;
use tauri::AppHandle;

static APP: OnceLock<AppHandle<Wry>> = OnceLock::new();

pub fn init_app_handle (app: AppHandle<tauri::Wry>) {
    APP.set(app).expect("Failed to set AppHandle");
}

pub fn get_app_handle () -> &'static AppHandle<tauri::Wry> {
    APP.get().expect("AppHandle is not initialized")
}

#[derive(Debug, Clone)]
pub struct AppSettings {
    pub token: String,
}

impl AppSettings {
    pub fn load_from_store<R: tauri::Runtime>(
        store: &Store<R>,
    ) -> Result<Self, Box<dyn std::error::Error>> {
        let token = store
            .get("appSettings.token")
            .and_then(|v| v.as_str().map(|s| s.to_string()))
            .unwrap_or_else(|| "".to_string());

        Ok(AppSettings {
            token,
        })
    }
}

pub struct AppState {
    pub store: Mutex<Store<Wry>>,
}

pub fn setup(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    init_app_handle(app.handle());
    let _stores = app.app_handle().state::<StoreCollection<Wry>>();
    // Init store and load it from disk
    let mut store = StoreBuilder::new(app.handle(), "settings.json".parse()?).build();

    // If there are no saved settings yet, this will return an error so we ignore the return value.
    let _ = store.load();

    let _app_settings = AppSettings::load_from_store(&store);

    // 将 settings 存储到应用状态中
    app.manage(AppState {
        store: Mutex::new(store),
    });

    Ok(())
}