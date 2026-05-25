import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";

const GuestRoute = () => {
  const { accessToken, user, loading, refresh, fetchMe } = useAuthStore();
  const [starting, setStarting] = useState(true);

  const init = async () => {
    // Tự động thử làm mới token khi tải lại trang để kiểm tra xem đã đăng nhập chưa
    if (!accessToken) {
      try {
        await refresh();
      } catch {
        // Bỏ qua nếu không có refresh token hợp lệ
      }
    }

    if (accessToken && !user) {
      try {
        await fetchMe();
      } catch {
        // Bỏ qua
      }
    }

    setStarting(false);
  };

  useEffect(() => {
    init();
  }, []);

  if (starting || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        Đang tải...
      </div>
    );
  }

  // Nếu đã đăng nhập, chuyển hướng về trang chủ
  if (accessToken) {
    return <Navigate to="/" replace />;
  }

  // Nếu chưa đăng nhập, cho phép đi tiếp (vào /signin hoặc /signup)
  return <Outlet />;
};

export default GuestRoute;
