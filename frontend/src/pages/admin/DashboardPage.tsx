import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { eventService } from '../../services/eventService';
import type {EventWithStats} from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getEventStatus } from '../../utils/eventUtils';

export default function DashboardPage() {

  const { admin } = useAuthStore();

  const [events, setEvents] = useState<EventWithStats[]>([]);

  const [loading, setLoading] = useState(true);

  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());



  const fetchEvents = async () => {

    setLoading(true);

    try {

      const response = await eventService.getEvents();

      setEvents(response);

      setSelectedEvents(new Set()); // 清除選取狀態

    } catch (error) {

      console.error('Fetch events error:', error);

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    fetchEvents();

  }, []);



  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {

    if (e.target.checked) {

      setSelectedEvents(new Set(events.map(event => event.id)));

    } else {

      setSelectedEvents(new Set());

    }

  };



  const handleSelectEvent = (id: string) => {

    const newSelected = new Set(selectedEvents);

    if (newSelected.has(id)) {

      newSelected.delete(id);

    } else {

      newSelected.add(id);

    }

    setSelectedEvents(newSelected);

  };



  const handleBulkDelete = async () => {

    if (selectedEvents.size === 0) return;

    

    if (window.confirm(`確定要刪除選取的 ${selectedEvents.size} 個活動嗎？此操作無法復原。`)) {

      setLoading(true);

      try {

        // 並行刪除所有選取的活動

        await Promise.all(Array.from(selectedEvents).map(id => eventService.deleteEvent(id)));

        await fetchEvents();

        alert('刪除成功');

      } catch (error) {

        console.error('Bulk delete error:', error);

        alert('刪除過程中發生錯誤');

        setLoading(false); // 發生錯誤時手動關閉 loading，否則 fetchEvents 會處理

      }

    }

  };



  if (loading) return <LoadingSpinner />;



  return (

    <div className="container mx-auto px-4 py-8">

      <div className="flex justify-between items-center mb-6">

        <div>

          <h1 className="text-3xl font-bold">儀表板</h1>

          <p className="text-gray-600 mt-2">

            歡迎回來，{admin?.name} ({admin?.username})

          </p>

        </div>

        <div className="flex gap-3">

          {selectedEvents.size > 0 && (

            <button

              onClick={handleBulkDelete}

              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition flex items-center"

            >

              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">

                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />

              </svg>

              刪除選取 ({selectedEvents.size})

            </button>

          )}

          <Link 

            to="/dashboard/create-event" 

            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition"

          >

            創建新活動

          </Link>

        </div>

      </div>



      <div className="bg-white rounded-lg shadow-md overflow-hidden">

        <div className="px-6 py-4 border-b">

          <h2 className="text-xl font-semibold">活動列表</h2>

        </div>

        

        {events.length === 0 ? (

          <div className="p-8 text-center text-gray-500">

            目前沒有活動，請點擊上方按鈕創建第一個活動。

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="min-w-full divide-y divide-gray-200">

              <thead className="bg-gray-50">

                <tr>

                  <th className="px-6 py-3 text-left">

                    <input

                      type="checkbox"

                      checked={selectedEvents.size === events.length && events.length > 0}

                      onChange={handleSelectAll}

                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"

                    />

                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">活動名稱</th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">時間</th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">權限</th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">簽到人數</th>

                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>

                </tr>

              </thead>

                            <tbody className="bg-white divide-y divide-gray-200">

                              {events.map((event) => {

                                return (

                                  <tr key={event.id} className="hover:bg-gray-50">

                                    <td className="px-6 py-4 whitespace-nowrap">

              

                        <input

                          type="checkbox"

                          checked={selectedEvents.has(event.id)}

                          onChange={() => handleSelectEvent(event.id)}

                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"

                        />

                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">

                        <Link to={`/dashboard/event/${event.id}`} className="text-indigo-600 hover:text-indigo-900 font-medium">

                          {event.name}

                        </Link>

                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">

                        {new Date(event.start_time).toLocaleDateString()}

                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">

                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${

                          event.visibility === 'public' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'

                        }`}>

                          {event.visibility === 'public' ? '公開' : '私人'}

                        </span>

                        {event.series_id && (

                          <span className="ml-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">

                            系列

                          </span>

                        )}

                      </td>

                                            <td className="px-6 py-4 whitespace-nowrap">

                                              {(() => {

                                                const status = getEventStatus(event);

                                                if (status === 'upcoming') {

                                                  return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">未開始</span>;

                                                } else if (status === 'active') {

                                                  return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">進行中</span>;

                                                } else {

                                                  return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">已結束</span>;

                                                }

                                              })()}

                                            </td>

                      

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">

                        {event.checkins}

                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">

                        <Link to={`/dashboard/event/${event.id}/checkins`} className="text-blue-600 hover:text-blue-900 mr-4">

                          簽到記錄

                        </Link>

                        <Link to={`/dashboard/event/${event.id}/edit`} className="text-gray-600 hover:text-gray-900">

                          編輯

                        </Link>

                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>

  );

}
