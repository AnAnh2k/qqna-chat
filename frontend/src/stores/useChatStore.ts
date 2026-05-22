import { chatService } from "@/services/chatService";
import type { ChatState } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      conversations: [],
      messages: {}, // key = conversationId, value = { items: Message[], hasMore: boolean, nextCursor: string | null }
      activeConversationId: null,
      loading: false,

      setActiveConversation: (id) => {
        set({ activeConversationId: id });
      },

      reset: () => {
        set({
          conversations: [],
          messages: {},
          activeConversationId: null,
          loading: false,
        });
      },
      fetchConversations: async () => {
        try {
          set({ loading: true });
          const { conversations } = await chatService.fetchConversations();
          set({ conversations, loading: false });
        } catch (error) {
          console.error("Lỗi khi fetch conversations:", error);
        } finally {
          set({ loading: false });
        }
      },
      markAsRead: async (conversationId: string) => {
        try {
          set((state) => {
            const conversations = state.conversations.map((convo) => {
              if (convo._id === conversationId) {
                const updatedUnread = { ...convo.unreadCounts };
                const userId = useAuthStore.getState().user?._id;
                if (userId) {
                  updatedUnread[userId] = 0;
                }
                return {
                  ...convo,
                  unreadCounts: updatedUnread,
                };
              }
              return convo;
            });
            return { conversations };
          });

          await chatService.markAsRead(conversationId);
        } catch (error) {
          console.error("Lỗi khi markAsRead:", error);
        }
      },
    }),
    {
      name: "chat-storage", // tên key trong localStorage
      partialize: (state) => ({ conversations: state.conversations }), // chỉ persist conversations
    },
  ),
);
