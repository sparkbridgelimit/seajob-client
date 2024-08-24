use sysinfo::{System};

pub fn get_node_executable() -> Result<String, Box<dyn std::error::Error>> {
    // 获取操作系统类型和版本
    let os_type = System::name().unwrap();
    let architecture = System::cpu_arch().unwrap();

    // 根据系统信息选择合适的 Node.js 可执行文件路径
    let node_executable = match (os_type.as_str(), architecture.as_str()) {
        ("Darwin", "arm64") => "resources/Darwin/arm64/seajob-client",
        _ => panic!("Unsupported operating system or architecture"),
    };

    Ok(node_executable.to_string())
}
