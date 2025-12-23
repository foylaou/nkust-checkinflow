/**
 * 受保護的路由組件
 * 需要管理員認證才能訪問
 */
import { Navigate, Outlet } from 'react-router-dom';
import {useAuthStore} from "../../store/authStore.ts";
import LoadingSpinner from "../LoadingSpinner.tsx";


export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
