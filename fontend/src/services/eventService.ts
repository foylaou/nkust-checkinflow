/**
 * 活動服務
 */
import { apiClient } from './api';
import type{ Event, EventWithStats, EventCreate, EventUpdate, EventStats, EventSeriesCreate } from '../types';

export const eventService = {
  /**
   * 獲取所有活動
   */
  async getEvents(): Promise<EventWithStats[]> {
    return apiClient.get('/api/events');
  },

  /**
   * 獲取公開活動
   */
  async getPublicEvents(): Promise<Event[]> {
    return apiClient.get('/api/events/public');
  },

  /**
   * 獲取活動詳情
   */
  async getEvent(id: string): Promise<Event> {
    return apiClient.get(`/api/events/${id}`);
  },

  /**
   * 創建活動
   */
  async createEvent(data: EventCreate): Promise<Event> {
    return apiClient.post('/api/events', data);
  },

  /**
   * 創建系列活動
   */
  async createEventSeries(data: EventSeriesCreate): Promise<Event[]> {
    return apiClient.post('/api/events/series', data);
  },

  /**
   * 更新活動
   */
  async updateEvent(id: string, data: EventUpdate): Promise<Event> {
    return apiClient.put(`/api/events/${id}`, data);
  },

  /**
   * 刪除活動
   */
  async deleteEvent(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/api/events/${id}`);
  },

  /**
   * 獲取活動統計
   */
  async getEventStats(id: string): Promise<EventStats> {
    return apiClient.get(`/api/events/${id}/stats`);
  },

  /**
   * 匯出活動簽到記錄
   */
  async exportEventCheckins(id: string, format: 'excel' | 'csv' = 'excel'): Promise<{ url: string }> {
    return apiClient.get(`/api/events/${id}/export`, { params: { format } });
  },
};