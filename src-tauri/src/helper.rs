use std::{path::PathBuf, process::Command};

pub fn remove_quarantine_attribute(path: &PathBuf) -> Result<(), String> {
    let check_status = Command::new("xattr")
        .args(&["-l", path.to_str().unwrap()])
        .output()
        .map_err(|e| format!("Failed to check xattr: {}", e))?;

    let output = String::from_utf8_lossy(&check_status.stdout);

    // 如果没有 com.apple.quarantine 属性，跳过删除
    if !output.contains("com.apple.quarantine") {
        println!("No quarantine attribute found, skipping removal.");
        return Ok(());
    }

    // 删除 com.apple.quarantine 属性
    let status = Command::new("xattr")
        .args(&["-d", "com.apple.quarantine", path.to_str().unwrap()])
        .status()
        .map_err(|e| format!("Failed to execute xattr command: {}", e))?;

    if !status.success() {
        return Err("Failed to remove quarantine attribute".to_string());
    }

    Ok(())
}
