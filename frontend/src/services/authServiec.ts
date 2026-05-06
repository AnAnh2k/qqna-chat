import api from "@/lib/axios";

export const authService = {
  signUp: async (
    username: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string,
  ) => {
    try {
      const res = await api.post(
        "/auth/signup",
        {
          username,
          password,
          email,
          firstName,
          lastName,
        },
        { withCredentials: true },
      );
      return res.data;
    } catch (error) {
      console.error("Lỗi khi đăng ký:", error);
      throw error;
    }
  },
  signIn: async (username: string, password: string) => {
    try {
      const res = await api.post(
        "/auth/signin",
        {
          username,
          password,
        },
        { withCredentials: true },
      );
      return res.data;
    } catch (error) {
      console.error("Lỗi khi đăng nhập:", error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      await api.post("/auth/signout", {}, { withCredentials: true });
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
      throw error;
    }
  },

  fetchMe: async () => {
    try {
      const res = await api.get("/users/me", { withCredentials: true });
      return res.data.user;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
      throw error;
    }
  },

  refresh: async () => {
    try {
      const res = await api.post(
        "/auth/refresh",
        {},
        { withCredentials: true },
      );
      return res.data.accessToken;
    } catch (error) {
      console.error("Lỗi khi refresh token:", error);
      throw error;
    }
  },
};
