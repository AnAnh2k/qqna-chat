import api from "@/lib/axios";
import type { User } from "@/types/user";

export type UpdateProfilePayload = Pick<
  User,
  "displayName" | "email"
> & {
  phone?: string;
  bio?: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export const userService = {
  uploadAvatar: async (formData: FormData) => {
    const res = await api.post("/users/uploadAvatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.status === 400) {
      throw new Error(res.data.message);
    }

    return res.data;
  },
  getUserById: async (userId: string) => {
    const res = await api.get(`/users/${userId}`);
    return res.data.user;
  },
  updateMe: async (payload: UpdateProfilePayload) => {
    const res = await api.patch("/users/me", payload);
    return res.data.user;
  },
  changePassword: async (payload: ChangePasswordPayload) => {
    const res = await api.patch("/users/me/password", payload);
    return res.data;
  },
};
