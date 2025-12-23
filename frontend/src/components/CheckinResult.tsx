import { Link } from 'react-router-dom';

interface CheckinResultProps {
  status: 'success' | 'error';
  title: string;
  message: string;
  userName?: string;
  time?: string;
  onRetry?: () => void;
}

export default function CheckinResult({
  status,
  title,
  message,
  userName,
  time,
  onRetry
}: CheckinResultProps) {
  const isSuccess = status === 'success';

  return (
    <div className={`flex flex-col justify-center items-center min-h-screen p-4 ${isSuccess ? 'bg-green-50' : 'bg-red-50'}`}>
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${isSuccess ? 'bg-green-100' : 'bg-red-100'}`}>
          {isSuccess ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        
        <h2 className={`text-2xl font-bold mb-2 ${isSuccess ? 'text-green-700' : 'text-red-700'}`}>
          {title}
        </h2>
        
        <p className="text-gray-600 mb-2">
          {isSuccess && userName ? `${userName}，` : ''}{message}
        </p>
        
        {isSuccess && time && (
          <p className="text-sm text-gray-500 mb-6">時間: {time}</p>
        )}

        {isSuccess ? (
          <div className="mt-6">
             <p className="text-sm text-gray-400">您可以關閉此頁面</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <button
              onClick={onRetry}
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition"
            >
              重試
            </button>
            <Link to="/" className="block w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition">
              返回首頁
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
