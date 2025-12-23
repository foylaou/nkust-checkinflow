import { useParams } from 'react-router-dom';
import EditEventForm from '../../components/EditEventForm';
import ErrorMessage from '../../components/ErrorMessage';

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) return <ErrorMessage message="無效的活動 ID" />;

  return (
    <div className="container mx-auto px-4 py-8">
      <EditEventForm eventId={id} />
    </div>
  );
}
