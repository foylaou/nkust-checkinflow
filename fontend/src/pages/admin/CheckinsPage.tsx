import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import CheckinListClient from '../../components/CheckinListClient';
import { eventService } from '../../services/eventService';
import type { Event } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function CheckinsPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchEvent = async () => {
      try {
        const event = await eventService.getEvent(id);
        setEvent(event);
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!id) return <div>Invalid Event ID</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to={`/dashboard/event/${id}`}
            className="text-gray-600 hover:text-gray-900"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold">
            {event ? `${event.name} - 簽到記錄` : '簽到記錄'}
          </h1>
        </div>
      </div>

      <CheckinListClient eventId={id} />
    </div>
  );
}
