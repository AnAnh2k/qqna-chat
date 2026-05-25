import { chatService } from "@/services/chatService";
import type { ChatState } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import { useSocketStore } from "./useSocketStore";

const getConversationTime = (conversation: any) => {
  const timestamp =
    conversation.lastMessageAt ??
    conversation.lastMessage?.createdAt ??
    conversation.updatedAt ??
    conversation.createdAt;

  return timestamp ? new Date(timestamp).getTime() : 0;
};

const sortConversationsByLatest = (conversations: any[]) =>
  [...conversations].sort(
    (a, b) => getConversationTime(b) - getConversationTime(a),
  );

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      activeConversationId: null,
      convoLoading: false, // convo loading
      messageLoading: false,
      loading: false,

      setActiveConversation: (id) => set({ activeConversationId: id }),
      reset: () => {
        set({
          conversations: [],
          messages: {},
          activeConversationId: null,
          convoLoading: false,
          messageLoading: false,
        });
      },
      fetchConversations: async () => {
        try {
          set({ convoLoading: true });
          const { conversations } = await chatService.fetchConversations();

          set({
            conversations: sortConversationsByLatest(conversations),
            convoLoading: false,
          });
        } catch (error) {
          console.error("Lỗi xảy ra khi fetchConversations:", error);
          set({ convoLoading: false });
        }
      },
      fetchMessages: async (conversationId) => {
        const { activeConversationId, messages } = get();
        const { user } = useAuthStore.getState();

        const convoId = conversationId ?? activeConversationId;

        if (!convoId) return;

        const current = messages?.[convoId];
        const nextCursor =
          current?.nextCursor === undefined ? "" : current?.nextCursor;

        if (nextCursor === null) return;

        set({ messageLoading: true });

        try {
          const { messages: fetched, cursor } = await chatService.fetchMessages(
            convoId,
            nextCursor,
          );

          const processed = fetched.map((m) => ({
            ...m,
            isOwn: m.senderId === user?._id,
          }));

          set((state) => {
            const prev = state.messages[convoId]?.items ?? [];
            const merged =
              prev.length > 0 ? [...processed, ...prev] : processed;

            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: merged,
                  hasMore: !!cursor,
                  nextCursor: cursor ?? null,
                },
              },
            };
          });
        } catch (error) {
          console.error("Lỗi xảy ra khi fetchMessages:", error);
        } finally {
          set({ messageLoading: false });
        }
      },
      sendDirectMessage: async (recipientId, content, imgUrl) => {
        try {
          const { activeConversationId } = get();
          await chatService.sendDirectMessage(
            recipientId,
            content,
            imgUrl,
            activeConversationId || undefined,
          );
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === activeConversationId ? { ...c, seenBy: [] } : c,
            ),
          }));
        } catch (error) {
          console.error("Lỗi xảy ra khi gửi direct message", error);
        }
      },
      sendGroupMessage: async (conversationId, content, imgUrl) => {
        try {
          await chatService.sendGroupMessage(conversationId, content, imgUrl);
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === get().activeConversationId ? { ...c, seenBy: [] } : c,
            ),
          }));
        } catch (error) {
          console.error("Lỗi xảy ra gửi group message", error);
        }
      },
      addMessage: async (message) => {
        try {
          const { user } = useAuthStore.getState();
          const { fetchMessages } = get();

          message.isOwn = message.senderId === user?._id;

          const convoId = message.conversationId;

          let prevItems = get().messages[convoId]?.items ?? [];

          if (prevItems.length === 0) {
            await fetchMessages(message.conversationId);
            prevItems = get().messages[convoId]?.items ?? [];
          }

          set((state) => {
            if (prevItems.some((m) => m._id === message._id)) {
              return state;
            }

            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: [...prevItems, message],
                  hasMore: state.messages[convoId].hasMore,
                  nextCursor: state.messages[convoId].nextCursor ?? undefined,
                },
              },
            };
          });
        } catch (error) {
          console.error("Lỗi xảy khi ra add message:", error);
        }
      },
      updateConversation: (conversation) => {
        set((state) => {
          const existingConversation = state.conversations.find(
            (c) => c._id === conversation._id,
          );

          const updatedConversation = existingConversation
            ? { ...existingConversation, ...conversation }
            : conversation;

          const nextConversations = existingConversation
            ? state.conversations.map((c) =>
                c._id === conversation._id ? updatedConversation : c,
              )
            : [updatedConversation, ...state.conversations];

          return {
            conversations: sortConversationsByLatest(nextConversations),
          };
        });
      },
      markAsSeen: async () => {
        try {
          const { user } = useAuthStore.getState();
          const { activeConversationId, conversations } = get();

          if (!activeConversationId || !user) {
            return;
          }

          const convo = conversations.find(
            (c) => c._id === activeConversationId,
          );

          if (!convo) {
            return;
          }

          if ((convo.unreadCounts?.[user._id] ?? 0) === 0) {
            return;
          }

          await chatService.markAsSeen(activeConversationId);

          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === activeConversationId && c.lastMessage
                ? {
                    ...c,
                    unreadCounts: {
                      ...c.unreadCounts,
                      [user._id]: 0,
                    },
                  }
                : c,
            ),
          }));
        } catch (error) {
          console.error("Lỗi xảy ra khi gọi markAsSeen trong store", error);
        }
      },
      addConvo: (convo) => {
        set((state) => {
          const exists = state.conversations.some(
            (c) => c._id.toString() === convo._id.toString(),
          );

          return {
            conversations: exists
              ? state.conversations
              : [convo, ...state.conversations],
            activeConversationId: convo._id,
          };
        });
      },
      createConversation: async (type, name, memberIds) => {
        try {
          set({ loading: true });
          const conversation = await chatService.createConversation(
            type,
            name,
            memberIds,
          );

          get().addConvo(conversation);

          useSocketStore
            .getState()
            .socket?.emit("join-conversation", conversation._id);
        } catch (error) {
          console.error(
            "Lỗi xảy ra khi gọi createConversation trong store",
            error,
          );
        } finally {
          set({ loading: false });
        }
      },
      clearConversation: async (conversationId) => {
        try {
          await chatService.clearConversation(conversationId);
          set((state) => {
            const nextMessages = { ...state.messages };
            delete nextMessages[conversationId];

            const nextConvos = state.conversations.map((c) =>
              c._id === conversationId ? { ...c, isCleared: true } : c
            );

            const activeId =
              state.activeConversationId === conversationId
                ? null
                : state.activeConversationId;

            return {
              messages: nextMessages,
              conversations: nextConvos,
              activeConversationId: activeId,
            };
          });
        } catch (error) {
          console.error(
            "Lỗi xảy ra khi gọi clearConversation trong store",
            error,
          );
        }
      },
      uploadMessageImage: async (file) => {
        return await chatService.uploadMessageImage(file);
      },
      recallMessage: async (messageId) => {
        try {
          await chatService.recallMessage(messageId);
        } catch (error) {
          console.error("Lỗi xảy ra khi recallMessage trong store", error);
          throw error;
        }
      },
      handleMessageRecalled: (messageId, conversationId) => {
        set((state) => {
          const convoMessages = state.messages[conversationId];
          if (!convoMessages) return {};

          const updatedItems = convoMessages.items.map((m) =>
            m._id === messageId
              ? { ...m, content: "", isRecalled: true, imgUrl: null }
              : m,
          );

          // Cập nhật tin nhắn cuối cùng trên sidebar nếu tin nhắn bị thu hồi là tin nhắn cuối cùng
          const conversations = sortConversationsByLatest(
            state.conversations.map((convo) => {
            if (
              convo._id === conversationId &&
              convo.lastMessage?._id === messageId
            ) {
              return {
                ...convo,
                lastMessage: {
                  ...convo.lastMessage,
                  content: "Tin nhắn đã được thu hồi",
                },
              };
            }
            return convo;
            }),
          );

          return {
            messages: {
              ...state.messages,
              [conversationId]: {
                ...convoMessages,
                items: updatedItems,
              },
            },
            conversations,
          };
        });
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({ conversations: state.conversations }),
    },
  ),
);
