/**
 * 主應用組件 - React Router 配置
 */
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Navbar } from './components/UI/Navbar';
import Footer from './components/UI/Footer';

// 公開頁面
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import AdminRegisterPage from './pages/public/AdminRegisterPage';
import EventPage from './pages/public/EventPage';

// 管理員頁面
import DashboardPage from './pages/admin/DashboardPage';
import CreateEventPage from './pages/admin/CreateEventPage';
import EventDetailPage from './pages/admin/EventDetailPage';
import CheckinsPage from './pages/admin/CheckinsPage';
import EditEventPage from './pages/admin/EditEventPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import TemplateManagementPage from './pages/admin/TemplateManagementPage';
import ChangePasswordPage from './pages/admin/ChangePasswordPage';

import './App.css';

function App() {
  const { checkAuth } = useAuthStore();

  // 應用啟動時檢查認證狀態
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-base-200">
        <Navbar />

        <main className="flex-1">
          <Routes>
            {/* 公開路由 */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/register" element={<AdminRegisterPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/event/:id" element={<EventPage />} />

            {/* 管理員受保護路由 */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/dashboard/create-event" element={<CreateEventPage />} />
              <Route path="/dashboard/event/:id" element={<EventDetailPage />} />
              <Route path="/dashboard/event/:id/checkins" element={<CheckinsPage />} />
              <Route path="/dashboard/event/:id/edit" element={<EditEventPage />} />
              <Route path="/dashboard/users" element={<UserManagementPage />} />
              <Route path="/dashboard/templates" element={<TemplateManagementPage />} />
              <Route path="/dashboard/change-password" element={<ChangePasswordPage />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
