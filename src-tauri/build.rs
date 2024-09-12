// use std::{env, fs};

fn main() {
    // // 获取构建目标平台
    // let target_os = env::var("CARGO_CFG_TARGET_OS").unwrap();
    // let target_arch = env::var("CARGO_CFG_TARGET_ARCH").unwrap();

    // // 日志输出平台和架构信息
    // println!("Building for target OS: {}", target_os);
    // println!("Building for target architecture: {}", target_arch);

    // // 根据不同的平台设置不同的资源路径
    // let resources = match (target_os.as_str(), target_arch.as_str()) {
    //     ("macos", "x86_64") => {
    //         println!("Using resources for macOS x86_64");
    //         vec!["resources/seajob-executor-macos"]
    //     },
    //     ("macos", "aarch64") => {
    //         println!("Using resources for macOS arm64 (aarch64)");
    //         vec!["resources/seajob-executor-macos-arm64"]
    //     },
    //     ("windows", _) => {
    //         println!("Using resources for Windows");
    //         vec!["resources/seajob-executor-win.exe"]
    //     },
    //     _ => {
    //         println!("No specific resources for this target");
    //         vec![]
    //     },
    // };

    // let current_dir = std::env::current_dir().unwrap();
    // println!("Current working directory: {}", current_dir.display());

    // // 读取 tauri.conf.json 文件
    // let config_path = "tauri.conf.json";
    // let mut config = fs::read_to_string(config_path).expect("Failed to read tauri.conf.json");

    // // 日志输出当前读取的 resources
    // println!("Original config: {}", config);

    // // 动态替换 resources 字段
    // let resources_str = serde_json::to_string(&resources).expect("Failed to convert resources to string");
    // config = config.replace("\"resources\": []", &format!("\"resources\": {}", resources_str));

    // // 日志输出更新后的 resources 配置
    // println!("Updated config with resources: {}", config);

    // // 写回配置文件
    // fs::write(config_path, config).expect("Failed to write to tauri.conf.json");

    tauri_build::build()
}
