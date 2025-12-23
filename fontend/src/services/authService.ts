/**
 * 認證服務
 */
import { apiClient } from './api';
import type {LoginRequest, LoginResponse, Admin} from '../types';

export const authService = {
  /**
   * 管理員登入
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.postForm<LoginResponse>(
      '/api/auth/login',
      credentials
    );

    // 存儲 token
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('admin', JSON.stringify(response.user));

    return response;
  },

  /**
   * 管理員登出
   */
  async logout(): Promise<void> {
    await apiClient.post('/api/auth/logout');
    localStorage.removeItem('access_token');
    localStorage.removeItem('admin');
  },

  /**
   * 獲取當前管理員信息
   */
  async getCurrentAdmin(): Promise<Admin> {
    return apiClient.get<Admin>('/api/auth/me');
  },

  /**
   * 獲取管理員列表
   */
  async getAdminList(): Promise<{ admins: Admin[] }> {
    return apiClient.get('/api/auth/users');
  },

  /**
   * 創建管理員
   */
  async createAdmin(data: {
    username: string;
    password: string;
    name: string;
  }): Promise<Admin> {
    return apiClient.post('/api/auth/users', data);
  },

  /**
   * 刪除管理員
   */
  async deleteAdmin(id: number): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/api/auth/users/${id}`);
  },

  /**
   * 切換管理員狀態
   */
  async toggleAdminStatus(id: number, isActive: boolean): Promise<{ success: boolean; message: string }> {
    return apiClient.put(`/api/auth/users/${id}/status`, { is_active: isActive });
  },

  /**
   * 註冊管理員 (公開)
   */
  async registerAdmin(data: {
    username: string;
    password: string;
    name: string;
  }): Promise<Admin> {
    return apiClient.post('/api/auth/register', data);
  },

  /**
   * 修改密碼
   */
  async changePassword(data: {
    old_password: string;
    new_password: string;
  }): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/api/auth/change-password', data);
  },

  /**
   * 獲取認證配置
   */
  async getConfig(): Promise<{ allow_registration: boolean }> {
    return apiClient.get('/api/auth/config');
  },

  /**
   * 生成 LINE 登入 URL
   */
  getLineLoginUrl(eventId?: string): string {
    const redirectUri = encodeURIComponent(
      `${import.meta.env.VITE_API_BASE_URL}/api/auth/line/callback`
    );
    const state = eventId || '';
    const channelId = import.meta.env.VITE_LINE_CHANNEL_ID;

    return `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${redirectUri}&state=${state}&scope=profile%20openid`;
  },

  /**
   * 檢查是否已登入
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  /**
   * 獲取本地存儲的管理員信息
   */
  getLocalAdmin(): Admin | null {
    const adminStr = localStorage.getItem('admin');
    if (!adminStr) return null;
    try {
      return JSON.parse(adminStr);
    } catch {
      return null;
    }
  },
};
