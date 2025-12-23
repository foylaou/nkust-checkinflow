import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import type {Event, EventStats} from '../../types';
import EventDetails from '../../components/EventDetails';
import EventDetailHeader from '../../components/EventDetailHeader';
import QRCodeSection from '../../components/QRCodeSection';
import CheckinStatsSection from '../../components/CheckinStatsSection';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { isEventActive } from '../../utils/eventUtils';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchEventData = async () => {
      try {
        setLoading(true);
        // 並行請求
        const [eventRes, statsRes] = await Promise.all([
          eventService.getEvent(id),
          eventService.getEventStats(id).catch(() => null) // 統計失敗不影響主頁面
        ]);

        setEvent(eventRes);
        if (statsRes) {
            setStats(statsRes);
        }
      } catch (err: any) {
        console.error('Error fetching event:', err);
        setError(err.response?.data?.detail || '無法加載活動詳情');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id]);

  const handleDownloadQR = () => {
    if (!event?.qrcode_url) return;
    const apiUrl = import.meta.env.VITE_API_BASE_URL || '';
    const url = `${apiUrl}/api/files/${event.qrcode_url}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `qrcode_event_${event.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintQR = () => {
    if (!event?.qrcode_url) return;
    const apiUrl = import.meta.env.VITE_API_BASE_URL || '';
    const url = `${apiUrl}/api/files/${event.qrcode_url}`;
    const windowContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Code</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
            img { max-width: 80%; max-height: 80%; }
            h1 { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>${event.name}</h1>
          <img src="${url}" onload="window.print();window.close()" />
        </body>
      </html>
    `;
    const printWindow = window.open('', '', 'width=600,height=600');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(windowContent);
      printWindow.document.close();
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!event) return <ErrorMessage message="活動不存在" />;

  return (
    <div className="container mx-auto px-4 py-8">
      <EventDetailHeader event={event} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">活動詳情</h2>
            <EventDetails
              startTime={event.start_time}
              endTime={event.end_time}
              location={event.location || '未指定'}
              requiresLocation={event.location_validation}
              isAvailable={isEventActive(event)}
            />
            {event.description && (
              <div className="mt-6 border-t pt-4">
                <h3 className="font-medium mb-2">活動描述</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <QRCodeSection
            event={event}
            onDownload={handleDownloadQR}
            onPrint={handlePrintQR}
          />
          
          <CheckinStatsSection
            event={event}
            stats={stats}
          />
        </div>
      </div>
    </div>
  );
}
