/**
 * 簽到服務
 */
import { apiClient } from './api';
import type {CheckinCreate, CheckinWithUser, Checkin, CheckinValidateResponse} from '../types';

export const checkinService = {
  /**
   * 創建簽到記錄
   */
  async createCheckin(data: CheckinCreate): Promise<{ success: boolean; checkin: Checkin }> {
    return apiClient.post('/api/checkins', data);
  },

  /**
   * 獲取活動的簽到記錄
   */
  async getEventCheckins(eventId: string): Promise<{ checkins: CheckinWithUser[] }> {
    return apiClient.get(`/api/events/${eventId}/checkins`);
  },

  /**
   * 驗證簽到資格
   */
  async validateCheckin(data: {
    user_id: number;
    event_id: string;
  }): Promise<CheckinValidateResponse> {
    return apiClient.post('/api/checkins/validate', data);
  },
};
