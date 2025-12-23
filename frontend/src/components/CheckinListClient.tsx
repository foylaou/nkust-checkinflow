import { useState, useEffect } from 'react';
import { checkinService } from '../services/checkinService';
import { eventService } from '../services/eventService';
import type {CheckinWithUser} from '../types';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface CheckinListClientProps {
  eventId: string;
}

export default function CheckinListClient({ eventId }: CheckinListClientProps) {
  const [checkins, setCheckins] = useState<CheckinWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCheckins = async () => {
      try {
        const data = await checkinService.getEventCheckins(eventId);
        setCheckins(data.checkins);
      } catch (err: any) {
        console.error('獲取簽到記錄錯誤:', err);
        setError(err.response?.data?.detail || '獲取簽到記錄失敗');
      } finally {
        setLoading(false);
      }
    };

    fetchCheckins();
  }, [eventId]);

  const handleExport = async (format: 'excel' | 'csv') => {
    try {
      const response = await eventService.exportEventCheckins(eventId, format);
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '';
      const fileUrl = `${apiUrl}${response.url}`;
      window.open(fileUrl, '_blank');
    } catch (err) {
      console.error('匯出失敗:', err);
      alert('匯出失敗，請稍後再試');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
      <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">簽到記錄 ({checkins.length})</h2>
              <div className="space-x-2">
                  <button
                      onClick={() => handleExport('excel')}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                  >
                      匯出 Excel
                  </button>
                  <button
                      onClick={() => handleExport('csv')}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                  >
                      匯出 CSV
                  </button>
              </div>
          </div>
          
          {checkins.length === 0 ? (
              <div className="text-center text-gray-500 py-8 border rounded-lg bg-gray-50">
                尚無簽到記錄
              </div>
          ) : (
              <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                      <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">單位/部門</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">手機</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">簽到時間</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">簽退時間</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
                      </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                      {checkins.map((checkin) => (
                          <tr key={checkin.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900">{checkin.user.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{checkin.user.company}</div>
                                <div className="text-xs text-gray-500">{checkin.user.department}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {checkin.user.phone}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(checkin.checkin_time).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {checkin.checkout_time
                                      ? new Date(checkin.checkout_time).toLocaleString()
                                      : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  checkin.status === '已簽退' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {checkin.status}
                                </span>
                              </td>
                          </tr>
                      ))}
                      </tbody>
                  </table>
              </div>
          )}
      </div>
  );
}