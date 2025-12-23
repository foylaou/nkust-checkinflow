import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function Navbar() {
  const {  isAuthenticated, isLoading, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const AdminLinks = () => (
    <div className="hidden md:flex items-center space-x-4">
      <Link
        to="/dashboard"
        className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition duration-150 ease-in-out shadow-sm"
      >
        儀表板
      </Link>
      <Link
        to="/dashboard/users"
        className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition duration-150 ease-in-out shadow-sm"
      >
        人員管理
      </Link>
      <Link
        to="/dashboard/templates"
        className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition duration-150 ease-in-out shadow-sm"
      >
        表單範本
      </Link>
      <Link
        to="/dashboard/change-password"
        className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition duration-150 ease-in-out shadow-sm"
      >
        修改密碼
      </Link>
      <button
        onClick={handleLogout}
        className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-md transition duration-150 ease-in-out shadow-sm"
      >
        登出
      </button>
    </div>
  );

  const MobileMenu = () => (
    <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden absolute top-16 right-0 left-0 bg-white shadow-lg z-10`}>
      <div className="px-4 py-3 space-y-2">
        {isAuthenticated ? (
          <>
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-center"
            >
              儀表板
            </Link>
            <Link
              to="/dashboard/users"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-center"
            >
              人員管理
            </Link>
            <Link
              to="/dashboard/templates"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-center"
            >
              表單範本
            </Link>
            <Link
              to="/dashboard/change-password"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-center"
            >
              修改密碼
            </Link>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-md text-center"
            >
              登出
            </button>
          </>
        ) : (
          <Link
            to="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-center"
          >
            後台登入
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <nav className="bg-white shadow-md sticky top-0 z-20">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center relative">
        <Link to="/" className="flex items-center group">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-indigo-600 group-hover:text-indigo-700 transition duration-150">
              CheckinFlow
            </h1>
            <span className="ml-2 text-gray-500 hidden sm:inline">活動簽到系統</span>
          </div>
        </Link>

        {!isLoading && (
          <>
            {isAuthenticated ? (
              <AdminLinks />
            ) : (
              <div className="hidden md:block">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition duration-150 ease-in-out shadow-sm"
                >
                  後台登入
                </Link>
              </div>
            )}

            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              >
                <span className="sr-only">開啟選單</span>
                {mobileMenuOpen ? (
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>

            <MobileMenu />
          </>
        )}
      </div>
    </nav>
  );
}