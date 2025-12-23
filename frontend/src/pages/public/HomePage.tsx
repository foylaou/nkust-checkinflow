/**
 * 首頁 - 顯示公開活動列表
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import type { Event } from '../../types';
import {eventService} from "../../services/eventService.ts";
import {getEventStatus} from "../../utils/eventUtils.ts";
import LoadingSpinner from "../../components/LoadingSpinner.tsx";


export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPublicEvents();
  }, []);

  const fetchPublicEvents = async () => {
    try {
      const response = await eventService.getPublicEvents();
      setEvents(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || '獲取活動列表失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const groupedEvents = {
    active: events.filter(e => getEventStatus(e) === 'active'),
    upcoming: events.filter(e => getEventStatus(e) === 'upcoming'),
    ended: events.filter(e => getEventStatus(e) === 'ended'),
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const renderEventGrid = (eventList: Event[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {eventList.map((event) => {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const qrCodeSrc = event.qrcode_url
          ? `${apiUrl}/api/files/${event.qrcode_url}`
          : '';

        return (
          <div key={event.id} className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body p-5">
              <h2 className="card-title text-lg">
                {event.name}
              </h2>

              {event.description && (
                <p className="text-sm text-base-content/70 line-clamp-2">{event.description}</p>
              )}

              <div className="space-y-1 mt-2 text-xs">
                <p>
                  <span className="font-semibold">開始：</span>
                  {new Date(event.start_time).toLocaleString('zh-TW')}
                </p>
                <p>
                  <span className="font-semibold">結束：</span>
                  {new Date(event.end_time).toLocaleString('zh-TW')}
                </p>
                {event.location && (
                  <p className="truncate">
                    <span className="font-semibold">地點：</span>
                    {event.location}
                  </p>
                )}
              </div>

              {/* QR Code 顯示 */}
              {event.qrcode_url && (
                <div className="mt-4 flex justify-center">
                  <div className="bg-white p-2 border rounded shadow-sm">
                    <img
                      src={qrCodeSrc}
                      alt={`${event.name} QR Code`}
                      className="w-24 h-24 object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="card-actions justify-end mt-4">
                <Link
                  to={`/event/${event.id}`}
                  className="btn btn-primary btn-sm"
                >
                  進入簽到
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-4xl font-bold text-center mb-10 text-indigo-700">活動簽到中心</h1>

      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-base-content/70">目前沒有公開活動</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 進行中 */}
          <div className="collapse collapse-arrow bg-green-50 border border-green-200 shadow-sm rounded-lg">
            <input type="radio" name="event-accordion" defaultChecked /> 
            <div className="collapse-title text-xl font-bold text-green-800 flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></span>
              進行中活動 ({groupedEvents.active.length})
            </div>
            <div className="collapse-content bg-white">
              {groupedEvents.active.length > 0 ? (
                renderEventGrid(groupedEvents.active)
              ) : (
                <p className="text-center py-8 text-gray-500">目前沒有進行中的活動</p>
              )}
            </div>
          </div>

          {/* 未開始 */}
          <div className="collapse collapse-arrow bg-yellow-50 border border-yellow-200 shadow-sm rounded-lg">
            <input type="radio" name="event-accordion" /> 
            <div className="collapse-title text-xl font-bold text-yellow-800 flex items-center">
              <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></span>
              未開始活動 ({groupedEvents.upcoming.length})
            </div>
            <div className="collapse-content bg-white">
              {groupedEvents.upcoming.length > 0 ? (
                renderEventGrid(groupedEvents.upcoming)
              ) : (
                <p className="text-center py-8 text-gray-500">目前沒有即將開始的活動</p>
              )}
            </div>
          </div>

          {/* 已結束 */}
          <div className="collapse collapse-arrow bg-gray-50 border border-gray-200 shadow-sm rounded-lg">
            <input type="radio" name="event-accordion" /> 
            <div className="collapse-title text-xl font-bold text-gray-800 flex items-center">
              <span className="w-3 h-3 bg-gray-400 rounded-full mr-3"></span>
              已結束活動 ({groupedEvents.ended.length})
            </div>
            <div className="collapse-content bg-white">
              {groupedEvents.ended.length > 0 ? (
                renderEventGrid(groupedEvents.ended)
              ) : (
                <p className="text-center py-8 text-gray-500">目前沒有已結束的活動</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
