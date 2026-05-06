import api from "@/lib/api";

export const authService = {
  signUp: async (username, password, email, firstName, lastName) => {
    try {
      const response = await api.post("/auth/signup", {
        username,
        password,
        email,
        firstName,
        lastName,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi đăng ký:", error);
      throw error;
    }
  },
  signIn: async (username, password) => {
    try {
      const response = await api.post("/auth/signin", {
        username,
        password,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi đăng nhập:", error);
      throw error;
    }
  },
  signOut: async () => {
    try {
      await api.post("/auth/signout");
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
      throw error;
    }
  },
};
