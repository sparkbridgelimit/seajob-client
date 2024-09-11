import { invoke } from "@tauri-apps/api";

export const isTauri = () => {
  return typeof window !== 'undefined' && !!window.__TAURI__;
};

export async function get_token() {
  return window.localStorage.getItem('token');
}

export const set_token = async (token: string) => {
  if (isTauri()) {
    try {
      await invoke("set_token", { token });
    } catch (error) {
      console.error("Error setting token in Tauri:", error);
    }
  }
  window.localStorage.setItem('token', token);
};

export const clear_token = async () => {
  if (isTauri()) {
    try {
      await invoke("clear_token", {});
    } catch (error) {
      console.error("Error setting token in Tauri:", error);
    }
  }
  window.localStorage.removeItem('token');
};

export function parseLog(log: string) {
  // 正则表达式用于匹配日志中的字段
  const logPattern = /^OK \| (\d+) \| (.+?) \| \[(\d+)-(\d+)K\] \| (https?:\/\/[^\s]+)$/;

  // 使用正则表达式匹配日志
  const match = log.match(logPattern);

  if (match) {
    // 提取公司名称和职位名称
    const [job_company, job_name] = match[2].split(' '); // 根据空格分割

    // 返回解析后的数据对象
    return {
      job_task_id: parseInt(match[1]),  // 提取 job_task_id
      job_name,                         // 职位名称
      company: job_company,                      // 公司名称
      job_link: match[5],               // 提取 job_link
      salary_range: [parseInt(match[3]), parseInt(match[4])] // 提取 salary_range 为 [min, max]
    };
  } else {
    throw new Error('日志格式不匹配');
  }
}