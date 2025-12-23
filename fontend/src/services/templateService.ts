/**
 * 註冊表單範本服務
 */
import { apiClient } from './api';
import type {RegistrationTemplate, RegistrationTemplateCreate} from '../types';

export const templateService = {
  /**
   * 獲取所有可用範本
   */
  async getTemplates(): Promise<RegistrationTemplate[]> {
    return apiClient.get('/api/templates');
  },

  /**
   * 獲取範本詳情
   */
  async getTemplate(id: string): Promise<RegistrationTemplate> {
    return apiClient.get(`/api/templates/${id}`);
  },

  /**
   * 創建範本
   */
  async createTemplate(data: RegistrationTemplateCreate): Promise<RegistrationTemplate> {
    return apiClient.post('/api/templates', data);
  },

  /**
   * 更新範本
   */
  async updateTemplate(id: string, data: Partial<RegistrationTemplateCreate>): Promise<RegistrationTemplate> {
    return apiClient.put(`/api/templates/${id}`, data);
  },

  /**
   * 刪除範本
   */
  async deleteTemplate(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/api/templates/${id}`);
  },
};
