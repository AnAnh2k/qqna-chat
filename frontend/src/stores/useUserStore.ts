import { userService } from "@/services/userService";
import type { UserState } from "@/types/store";
import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { toast } from "sonner";
import { useChatStore } from "./useChatStore";

export const useUserStore = create<UserState>((set) => ({
  selectedProfileUser: null,
  profileModalOpen: false,
  profileLoading: false,
  setProfileModalOpen: (open) => set({ profileModalOpen: open }),
  updateProfile: async (payload) => {
    try {
      const updatedUser = await userService.updateMe(payload);
      useAuthStore.getState().setUser(updatedUser);
      set((state) => ({
        selectedProfileUser:
          state.selectedProfileUser?._id === updatedUser._id
            ? updatedUser
            : state.selectedProfileUser,
      }));
      useChatStore.getState().fetchConversations();
      toast.success("Cập nhật thông tin thành công!");
    } catch (error) {
      console.error("Lỗi khi updateProfile:", error);
      toast.error("Cập nhật thông tin không thành công!");
      throw error;
    }
  },
  viewProfile: async (userId) => {
    set({ profileModalOpen: true, profileLoading: true, selectedProfileUser: null });
    try {
      const user = await userService.getUserById(userId);
      set({ selectedProfileUser: user, profileLoading: false });
    } catch (error) {
      console.error("Lỗi khi viewProfile:", error);
      toast.error("Không thể tải thông tin người dùng!");
      set({ profileLoading: false, profileModalOpen: false });
    }
  },
  updateAvatarUrl: async (formData) => {
    try {
      const { user, setUser } = useAuthStore.getState();
      const data = await userService.uploadAvatar(formData);

      if (user) {
        setUser({
          ...user,
          avatarUrl: data.avatarUrl,
        });

        useChatStore.getState().fetchConversations();
        toast.success("Cập nhật ảnh đại diện thành công!");
      }
    } catch (error) {
      console.error("Lỗi khi updateAvatarUrl", error);
      toast.error("Upload avatar không thành công!");
    }
  },
}));
