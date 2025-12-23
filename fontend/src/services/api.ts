/**
 * Axios API 客戶端配置
 */
import axios, {type AxiosInstance, type AxiosRequestConfig, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 請求攔截器 - 添加 token
    this.client.interceptors.request.use(
      (config) => {
        // 優先檢查管理員 token
        const adminToken = localStorage.getItem('access_token');
        // 其次檢查用戶 token (LINE Login)
        const userToken = localStorage.getItem('line_access_token');

        if (adminToken) {
            config.headers.Authorization = `Bearer ${adminToken}`;
        } else if (userToken) {
             // 如果沒有管理員 token，但有用戶 token，則使用用戶 token
             // 注意：後端需要能區分或接受這兩種 token
             config.headers.Authorization = `Bearer ${userToken}`;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 響應攔截器 - 統一錯誤處理
    this.client.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // 判斷是管理員還是用戶的 401
          const adminToken = localStorage.getItem('access_token');
          const userToken = localStorage.getItem('line_access_token');
          const currentPath = window.location.pathname;

          // 定義公共路由（不需要強制登入的頁面）
          const publicRoutes = ['/event/', '/public/'];
          const isPublicRoute = publicRoutes.some(route => currentPath.startsWith(route));

          if (adminToken) {
              // 如果是管理員 token 過期，清除並重定向到管理員登入
              localStorage.removeItem('access_token');
              localStorage.removeItem('admin');
              // 只有在管理員頁面才重定向
              if (currentPath.startsWith('/admin') || currentPath === '/login') {
                window.location.href = '/login';
              }
          } else if (userToken) {
              // 如果是用戶 token 過期，清除
              localStorage.removeItem('line_access_token');
              localStorage.removeItem('current_user_id');
              // 不強制重定向到 /login (因為那是管理員登入)，
              // 而是讓當前頁面處理錯誤 (例如顯示"請重新登入")
          } else {
             // 如果都沒有 token 卻收到 401
             // 只有在非公共路由且不是根路徑時才重定向
             if (!isPublicRoute && currentPath !== '/' && currentPath.startsWith('/admin')) {
                  window.location.href = '/login';
             }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get(url, config);
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post(url, data, config);
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.put(url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete(url, config);
  }

  // 表單數據提交（用於 OAuth2 登入）
  async postForm<T>(url: string, data: any, config?: AxiosRequestConfig): Promise<T> {
    const formData = new URLSearchParams();
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });

    return this.client.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...config?.headers,
      },
    });
  }
}

export const apiClient = new ApiClient();
