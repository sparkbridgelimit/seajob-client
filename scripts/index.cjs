const puppeteer = require("puppeteer-extra");
const path = require("path");
const { resolve } = require('path');

console.log('Starting script...');
// 获取命令行参数
const args = process.argv.slice(2);
const fileArgIndex = args.indexOf('-f');
let filePath;

// 优先使用命令行参数
if (fileArgIndex !== -1 && fileArgIndex < args.length - 1) {
    filePath = args[fileArgIndex + 1];
} else if (process.env.SCRIPT_PATH) {
    // 其次使用环境变量
    filePath = process.env.SCRIPT_PATH;
} else {
    filePath = 'scripts/start.cjs';
}

// 解析文件路径
const resolvedFilePath = resolve(filePath);
console.log(`Loading script: ${resolvedFilePath}`);

// 设置 Chrome 路径环境变量
const chromePath = path.join(path.dirname(process.execPath), "chrome/mac_arm-126.0.6478.182/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing");
process.env.CHROME_PATH = chromePath;
console.log(`Chrome path set to: ${chromePath}`);

try {
  // 使用 require 加载并执行脚本
  require(resolvedFilePath);
} catch (error) {
  console.error(`Failed to load or execute script ${resolvedFilePath}:`, error);
  process.exit(1);
}
