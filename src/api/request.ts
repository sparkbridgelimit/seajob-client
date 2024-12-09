import axios from 'axios';
import { clear_token, get_token } from "@/helper";
import router from "@/router";
import { toast } from "@/hooks/use-toast"

const APP_HOST_MAP = {
  auth: {
    DEV: 'http://localhost:8080',
    PROD: 'https://auth.snowycat.cn',
  },
  seajob: {
    DEV: 'http://localhost:8080',
    PROD: 'https://seajob.snowycat.cn',
  },
} as const;

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error_code?: number;
  error_message?: string;
}

export interface IRequestProps {
  path: string;
  data?: Record<string, any>;
  app: keyof typeof APP_HOST_MAP;
  env?: 'DEV' | 'PROD';
  method?: 'POST' | 'GET' | 'PUT' | 'DELETE';
}

// 构建请求路径
export function build_path(app: keyof typeof APP_HOST_MAP, path: string, env: 'DEV' | 'PROD') {
  const isAbsolutePath = /^(https?:)?\/\//i.test(path);

  if (isAbsolutePath) return path;

  const baseUrl = APP_HOST_MAP[app]?.[env];
  if (!baseUrl) {
    throw new Error(`Invalid app or environment: app=${app}, env=${env}`);
  }

  return `${baseUrl}${path}`;
}

// 统一处理 401 错误
function handleUnauthorized() {
  clear_token();
  router.navigate('/signin');
  throw new Error('Unauthorized');
}

// 创建 Axios 实例
const apiClient = axios.create({ timeout: 5000, proxy: false });

// 请求拦截器
apiClient.interceptors.request.use(async (config) => {
  const token = await get_token();
  if (token) {
    config.headers?.set('Authorization', `Bearer ${token}`);
  }
  config.headers?.set('Content-Type', 'application/json');
  return config;
}, (error) => Promise.reject(error));

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    const { success, error_code } = response.data;
    if (!success && error_code === 401) {
      console.log('handleUnauthorized')
      toast({
        description: '未认证, 请重新登陆',
      });
      handleUnauthorized(); // 统一处理 401
    }
    return response;
  },
  (error) => {
    console.log('error', error)
    if (error.response?.status === 401) {
      toast({
        description: '未认证, 请重新登陆',
      });
      handleUnauthorized(); // 处理 HTTP 层面的 401
    }
    const { status, statusText = 'Unknown Error' } = error.response || {};
    throw new Error(`HTTP Error: ${status} - ${statusText}`);
  }
);

// 公共请求逻辑
export async function request<T>({
  app = 'seajob',
  path = '/',
  data = {},
  env = 'PROD',
  method = 'POST',
}: IRequestProps): Promise<T> {
  const url = build_path(app, path, env);

  const response = await apiClient<ApiResponse<T>>({ url, method, data });
  const { success, data: responseData, error_message } = response.data;

  if (!success) {
    throw new Error(
      `Business Error: ${error_message || 'Unknown error'}`
    );
  }
  return responseData!;
}