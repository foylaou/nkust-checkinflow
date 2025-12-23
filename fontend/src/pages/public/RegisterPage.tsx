import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import RegisterForm from '../../components/RegisterForm';
import { userService } from '../../services/userService';

import ErrorMessage from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';


export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lineId = searchParams.get('lineId');
  const eventId = searchParams.get('eventId');

  if (!lineId) {
    return <ErrorMessage message="無效的註冊連結：缺少 LINE ID" />;
  }

  const handleRegister = async (formData: {
    name: string;
    phone: string;
    company: string;
    department: string;
  }) => {
    setSubmitting(true);
    setError(null);

    try {
      // 1. 創建用戶
       await userService.createUser({
        line_user_id: lineId,
        ...formData
      });

      // 2. 自動登入（這裡模擬登入，或者調用特定的後端 API 來獲取 token）
      // 由於後端 createUser 不返回 token，我們可能需要重新導向到 LINE login 
      // 或者後端 createUser 可以返回 token
      // 為了簡化流程，這裡我們假設用戶已經註冊成功，
      // 並引導他們重新進行 LINE 登入流程以獲取 token 並跳轉到活動頁面
      
      // 如果 eventId 存在，重新觸發 LINE 登入流程，這將識別到用戶已註冊並跳轉到活動頁面
      if (eventId) {
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
          const redirectUri = encodeURIComponent(`${apiBaseUrl}/api/auth/line/callback`);
          // 使用 eventId 作為 state
          const state = eventId; 
          const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${import.meta.env.VITE_LINE_CHANNEL_ID}&redirect_uri=${redirectUri}&state=${state}&scope=profile%20openid&nonce=${Math.random().toString(36).substring(2, 15)}`;
          window.location.href = lineAuthUrl;
      } else {
          // 如果沒有 eventId，跳轉到首頁
          navigate('/');
      }

    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.response?.data?.detail || '註冊失敗，請稍後再試');
      setSubmitting(false);
    }
  };

  if (submitting) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">正在處理註冊...</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">歡迎加入 CheckinFlow</h1>
        <p className="text-gray-600 text-center mb-8">
          請填寫以下資訊以完成註冊，完成後將自動跳轉至活動頁面。
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
            {error}
          </div>
        )}

        <RegisterForm onSubmit={handleRegister} />
      </div>
    </div>
  );
}