/**
 * 用戶服務
 */
import { apiClient } from './api';
import type {User, UserCreate} from "../types";


export const userService = {
  /**
   * 獲取用戶列表
   */
  async getUsers(): Promise<{ users: User[] }> {
    return apiClient.get('/api/users');
  },

  /**
   * 創建用戶（註冊）
   */
  async createUser(data: UserCreate): Promise<User> {
    return apiClient.post('/api/users', data);
  },

  /**
   * 獲取用戶詳情
   */
  async getUser(userId: number): Promise<User> {
    return apiClient.get(`/api/users/${userId}`);
  },
};
