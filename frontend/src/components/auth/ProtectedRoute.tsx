import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState, useRef } from "react";
import { Navigate, Outlet } from "react-router";

const ProtectedRoute = () => {
  const { accessToken, user, loading, refresh, fetchMe } = useAuthStore();
  const [starting, setStarting] = useState(true);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const checkAuth = async () => {
      try {
        // có thể xảy ra khi refresh trang, lúc này accessToken đã bị mất nhưng user vẫn còn, nên cần refresh token để lấy lại accessToken
        if (!accessToken) {
          await refresh();
        }
        if (accessToken && !user) {
          await fetchMe();
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra xác thực:", error);
      } finally {
        // Đảm bảo cập nhật state bất đồng bộ để tránh cảnh báo react-hooks/set-state-in-effect
        await Promise.resolve();
        setStarting(false);
      }
    };

    checkAuth();
  }, [accessToken, user, refresh, fetchMe]);

  if (starting || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Đang tải trang...
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/signin" replace />;
  }
  return <Outlet></Outlet>;
};

export default ProtectedRoute;
