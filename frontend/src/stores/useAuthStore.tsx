import { create } from "zustand";
import { toast } from "sonner";

export const useAuthStore = create((set, get) => ({
  accessToken: null,
  user: null,
  loading: false,

  signUp: async (username, password, email, firstName, lastName) => {
    set({ loading: true });
    try {
      set({ loading: true });
      // gọi backend API để đăng ký người dùng
      console.log("Đăng ký với dữ liệu:", {
        username,
        password,
        email,
        firstName,
        lastName,
      });
      toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
    } catch (error) {
      console.error("Lỗi khi đăng ký:", error);
      toast.error("Đăng ký không thành công. Vui lòng thử lại.");
    } finally {
      set({ loading: false });
    }
  },
}));
