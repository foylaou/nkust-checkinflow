/**
 * 管理員登入頁面
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {useAuthStore} from "../../store/authStore.ts";
import {authService} from "../../services/authService.ts";


export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    authService.getConfig().then(config => {
      setAllowRegistration(config.allow_registration);
    }).catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || '登入失敗：用戶名或密碼錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold text-center justify-center mb-4">
            會員/後台登入
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 錯誤提示 */}
            {error && (
              <div className="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* 用戶名 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">用戶名</span>
              </label>
              <input
                type="text"
                placeholder="請輸入用戶名"
                className="input input-bordered"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* 密碼 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">密碼</span>
              </label>
              <input
                type="password"
                placeholder="請輸入密碼"
                className="input input-bordered"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* 提交按鈕 */}
            <div className="form-control mt-6">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    登入中...
                  </>
                ) : (
                  '登入'
                )}
              </button>
            </div>
            
            {allowRegistration && (
              <div className="text-center mt-4">
                <Link to="/admin/register" className="link link-primary">
                  註冊新帳號
                </Link>
              </div>
            )}
          </form>

          {/* 提示 */}
          <div className="divider">測試帳號</div>
          <div className="text-sm text-center text-base-content/70">
            <p>系統管理員: admin / admin123</p>
            <p>普通管理員: manager / manager123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
