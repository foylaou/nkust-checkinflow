/**
 * 認證狀態管理
 */
import { create } from 'zustand';
import type {Admin} from "../types";
import {authService} from "../services/authService.ts";


interface AuthState {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setAdmin: (admin: Admin | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  admin: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (username, password) => {
    try {
      const response = await authService.login({ username, password });
      set({
        admin: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        admin: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      // 即使 API 調用失敗，也清除本地狀態
      console.error('Logout error:', error);
    } finally {
      set({
        admin: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  checkAuth: async () => {
    try {
      // 檢查本地是否有 token
      const token = localStorage.getItem('access_token');
      if (!token) {
        set({ isLoading: false, isAuthenticated: false, admin: null });
        return;
      }

      // 驗證 token 是否有效
      const admin = await authService.getCurrentAdmin();
      set({
        admin,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      // Token 無效，清除本地存儲
      localStorage.removeItem('access_token');
      localStorage.removeItem('admin');
      set({
        admin: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setAdmin: (admin) => {
    set({ admin, isAuthenticated: !!admin });
  },
}));
