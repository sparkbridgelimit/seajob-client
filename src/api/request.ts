import { get_token } from "@/helper";
import router from "@/router";

export interface IRequestProps {
  path: string;
  data?: any;
  app: string;
  env?: string;
}

// 公共请求逻辑
export async function request({
  app = 'seajob',
  path = '/',
  data = {},
  env = 'PROD',
}: IRequestProps) {
  const url = build_path(app, path, env);

  const token = await get_token();
  console.log('token:', token);
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token,
  };

  // 发起请求
  const json = await window.fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })
  .then(response => response.json())

  if (json.success) {
    return json;
  }

  // 如果响应状态码是 401，跳转到 /signin
  if (json.error_code === 401) {
    router.navigate('/signin');
    return Promise.reject(new Error('Unauthorized'));
  }

  return Promise.reject(new Error(json.message));
}

const APP_HOST_MAP = {
  auth: {
    DEV: 'http://localhost:8080',
    PROD: 'https://auth.snowycat.cn',
  },
  seajob: {
    DEV: 'http://localhost:8080',
    PROD: 'https://seajob.snowycat.cn',
  },
}

export function build_path(app: string, path: string, env: string) {
  const isAbsolutePath = /^(https?:)?\/\//i.test(path);
  
  if (isAbsolutePath) {
    return path;
  }

  const baseUrl = APP_HOST_MAP[app][env];

  return `${baseUrl}${path}`;
}
