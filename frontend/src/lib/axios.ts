import { useAuthStore } from "@/stores/useAuthStore";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api", // Đặt baseURL từ biến môi trường
  withCredentials: true, // Gửi cookie cùng với yêu cầu
});

//gán access token vào req header
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

//tự động gọi refresh token khi access token hết hạn
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response || !originalRequest?.url) {
      return Promise.reject(error);
    }

    // những api không cần check
    if (
      originalRequest.url.includes("/auth/signin") ||
      originalRequest.url.includes("/auth/signup") ||
      originalRequest.url.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retryCount = originalRequest._retryCount || 0;

    if (error.response.status === 403 && originalRequest._retryCount < 4) {
      originalRequest._retryCount += 1;

      console.log(
        `Access token có thể đã hết hạn. Thử refresh token lần ${originalRequest._retryCount}...`,
      );

      try {
        const res = await api.post(
          "/auth/refresh",
          {},
          { withCredentials: true },
        );
        const newAccessToken = res.data.accessToken;
        useAuthStore.getState().setAccessToken(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (err) {
        console.error("Lỗi khi refresh token:", err);
        useAuthStore.getState().clearState();
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
