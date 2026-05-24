import { create } from "zustand";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import type { AuthState } from "@/types/store";
import { persist } from "zustand/middleware";
import { useChatStore } from "./useChatStore";
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      loading: false,

      setAccessToken: (accessToken) => {
        set({ accessToken });
      },

      clearState: () => {
        set({ accessToken: null, user: null, loading: false });
        useChatStore.getState().reset(); // Reset chat store về trạng thái ban đầu khi đăng xuất

        localStorage.clear(); // Xóa toàn bộ localStorage khi đăng xuất, bao gồm cả các store khác nếu có. Nếu chỉ muốn xóa auth-store, có thể sử dụng localStorage.removeItem("auth-storage") thay vì clear()
        sessionStorage.clear(); // Xóa sessionStorage khi đăng xuất nếu có sử dụng
      },

      signUp: async (username, password, email, firstName, lastName) => {
        try {
          set({ loading: true });
          // gọi backend API để đăng ký người dùng
          await authService.signUp(
            username,
            password,
            email,
            firstName,
            lastName,
          );
          toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
        } catch (error) {
          console.error("Lỗi khi đăng ký:", error);
          toast.error("Đăng ký không thành công. Vui lòng thử lại.");
          throw error;
        } finally {
          set({ loading: false });
        }
      },
      signIn: async (username, password) => {
        try {
          get().clearState(); // Clear state trước khi đăng nhập mới để tránh dữ liệu cũ còn
          set({ loading: true });

          localStorage.clear(); // Xóa toàn bộ localStorage trước khi đăng nhập, bao gồm cả các store khác nếu có. Nếu chỉ muốn xóa auth-store, có thể sử dụng localStorage.removeItem("auth-storage") thay vì clear()

          const { accessToken } = await authService.signIn(username, password);
          get().setAccessToken(accessToken);

          await get().fetchMe();

          useChatStore.getState().fetchConversations(); // Tải conversations sau khi đăng nhập thành công để có dữ liệu sẵn sàng khi vào trang chat

          toast.success("Chào mừng bạn quay lại vơi QQNA 🎉!");
        } catch (error) {
          console.error("Lỗi khi đăng nhập:", error);
          toast.error("Đăng nhập không thành công. Vui lòng kiểm tra lại.");
          throw error;
        } finally {
          set({ loading: false });
        }
      },
      signOut: async () => {
        try {
          get().clearState();
          await authService.signOut();
          toast.success("Đăng xuất thành công!");
        } catch (error) {
          console.error("Lỗi khi đăng xuất:", error);
          toast.error("Đăng xuất không thành công. Vui lòng thử lại.");
          throw error;
        }
      },

      fetchMe: async () => {
        try {
          set({ loading: true });
          const user = await authService.fetchMe();
          set({ user });
        } catch (error) {
          console.error("Lỗi khi lấy thông tin người dùng:", error);
          set({ user: null, accessToken: null });
          toast.error("Không thể lấy thông tin người dùng. Vui lòng thử lại.");
        } finally {
          set({ loading: false });
        }
      },

      refresh: async () => {
        try {
          set({ loading: true });
          const { user, fetchMe } = get();

          const accessToken = await authService.refresh();
          get().setAccessToken(accessToken);
          if (!user) {
            await fetchMe();
          }
          return accessToken;
        } catch (error) {
          console.error("Lỗi khi refresh token:", error);
          toast.error("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại!");
          get().clearState();
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "auth-storage", // tên key trong localStorage
      partialize: (state) => ({ user: state.user }), // chỉ persist user
    },
  ),
);
