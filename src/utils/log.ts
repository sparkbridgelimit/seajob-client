// utils/log.ts
import { isTauri } from "@/helper";
import { trace as tauriTrace, info as tauriInfo, error as tauriError, attachConsole } from "tauri-plugin-log-api";

type LogLevel = "trace" | "info" | "error";

/**
 * 通用日志记录方法
 * @param level 日志级别 ("trace", "info", "error")
 * @param message 日志内容
 */
const log = (level: LogLevel, ...message: any[]): void => {
  const formattedMessage = message.map(m => (typeof m === "object" ? JSON.stringify(m) : String(m))).join(" ");

  if (isTauri()) {
    // 在 Tauri 环境下，使用 tauri-plugin-log-api
    switch (level) {
      case "trace":
        tauriTrace(formattedMessage);
        break;
      case "info":
        tauriInfo(formattedMessage);
        break;
      case "error":
        tauriError(formattedMessage);
        break;
    }
  } else {
    // 在 Web 环境下，使用 console API
    switch (level) {
      case "trace":
        console.trace(formattedMessage);
        break;
      case "info":
        console.info(formattedMessage);
        break;
      case "error":
        console.error(formattedMessage);
        break;
    }
  }
};

/**
 * 附加 Tauri 后端日志到浏览器控制台。
 * 如果不是 Tauri 环境，直接返回一个 no-op 函数。
 */
const attachConsoleLogs = async (): Promise<() => void> => {
  if (isTauri()) {
    const detach = await attachConsole();
    return detach;
  } else {
    console.info("Not running in Tauri, no backend logs attached.");
    return () => {};
  }
};

// 导出封装的日志方法
export const logUtils = {
  trace: (...message: any[]) => log("trace", ...message),
  info: (...message: any[]) => log("info", ...message),
  error: (...message: any[]) => log("error", ...message),
  attachConsoleLogs,
};