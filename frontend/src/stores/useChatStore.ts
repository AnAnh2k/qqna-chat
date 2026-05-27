import { chatService } from "@/services/chatService";
import type { Conversation, Message } from "@/types/chat";
import type { ChatState } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import { useSocketStore } from "./useSocketStore";
import { playActionSound } from "@/lib/soundEffects";

const getConversationTime = (conversation: Conversation) => {
  const timestamp =
    conversation.lastMessageAt ??
    conversation.lastMessage?.createdAt ??
    conversation.updatedAt ??
    conversation.createdAt;

  return timestamp ? new Date(timestamp).getTime() : 0;
};

const sortConversationsByLatest = (conversations: Conversation[]) =>
  [...conversations].sort(
    (a, b) => getConversationTime(b) - getConversationTime(a),
  );

const getForwardPayload = (message: Message) => {
  const imageUrls =
    message.imgUrls && message.imgUrls.length > 0
      ? message.imgUrls
      : message.imgUrl
        ? [message.imgUrl]
        : [];
  const messageType = message.messageType === "post" ? "post" : "user";

  return {
    content: message.content ?? "",
    imgUrl: imageUrls.length === 1 ? imageUrls[0] : undefined,
    imgUrls: imageUrls.length > 1 ? imageUrls : undefined,
    title: messageType === "post" ? (message.title ?? undefined) : undefined,
    messageType,
  };
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      activeConversationId: null,
      convoLoading: false, // convo loading
      messageLoading: false,
      loading: false,
      replyingTo: null,

      setActiveConversation: (id) => {
        const currentId = get().activeConversationId;
        set({ activeConversationId: id });

        if (id && id !== currentId) {
          playActionSound("select");
        }
      },
      reset: () => {
        set({
          conversations: [],
          messages: {},
          activeConversationId: null,
          convoLoading: false,
          messageLoading: false,
          replyingTo: null,
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
      sendDirectMessage: async (recipientId, content, imgUrl, title, messageType, imgUrls, replyTo) => {
        try {
          const { activeConversationId } = get();
          await chatService.sendDirectMessage(
            recipientId,
            content,
            imgUrl,
            activeConversationId || undefined,
            title,
            messageType,
            imgUrls,
            replyTo,
          );
          set({ replyingTo: null });
          playActionSound("send");
        } catch (error) {
          console.error("Lỗi xảy ra khi gửi direct message", error);
        }
      },
      sendGroupMessage: async (
        conversationId,
        content,
        imgUrl,
        mentionedUserIds,
        title,
        messageType,
        imgUrls,
        replyTo,
      ) => {
        try {
          await chatService.sendGroupMessage(
            conversationId,
            content,
            imgUrl,
            mentionedUserIds,
            title,
            messageType,
            imgUrls,
            replyTo,
          );
          set({ replyingTo: null });
          playActionSound("send");
        } catch (error) {
          console.error("Lỗi xảy ra gửi group message", error);
        }
      },
      forwardMessage: async (message, targets) => {
        try {
          const { conversations } = get();
          const payload = getForwardPayload(message);

          for (const target of targets) {
            if (target.type === "friend") {
              const directConversation = conversations.find(
                (conversation) =>
                  conversation.type === "direct" &&
                  conversation.participants.some(
                    (participant) => participant._id === target.id,
                  ),
              );

              await chatService.sendDirectMessage(
                target.id,
                payload.content,
                payload.imgUrl,
                directConversation?._id,
                payload.title,
                payload.messageType,
                payload.imgUrls,
              );
            } else {
              await chatService.sendGroupMessage(
                target.id,
                payload.content,
                payload.imgUrl,
                [],
                payload.title,
                payload.messageType,
                payload.imgUrls,
              );
            }
          }

          playActionSound("send");
        } catch (error) {
          console.error("Lỗi xảy ra khi chuyển tiếp tin nhắn", error);
          throw error;
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

          const updatedConversation: Conversation = existingConversation
            ? { ...existingConversation, ...conversation }
            : (conversation as Conversation);

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
      removeConversation: (conversationId) => {
        set((state) => {
          const nextMessages = { ...state.messages };
          delete nextMessages[conversationId];

          return {
            messages: nextMessages,
            conversations: state.conversations.filter(
              (c) => c._id !== conversationId,
            ),
            activeConversationId:
              state.activeConversationId === conversationId
                ? null
                : state.activeConversationId,
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

          const lastMsg = convo.lastMessage;
          if (!lastMsg) {
            return;
          }

          const isLastMsgOwn =
            (typeof lastMsg.sender === "string"
              ? lastMsg.sender
              : lastMsg.sender?._id) === user._id;
          const mySeen = (convo.seenBy ?? []).find(
            (s) => {
              const seenUserId =
                typeof s.userId === "string" ? s.userId : s.userId?._id;

              return seenUserId === user._id;
            },
          );
          const alreadySeen = mySeen && mySeen.messageId === lastMsg._id;

          if (isLastMsgOwn || alreadySeen) {
            if ((convo.unreadCounts?.[user._id] ?? 0) > 0) {
              set((state) => ({
                conversations: state.conversations.map((c) =>
                  c._id === activeConversationId
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
            }
            return;
          }

          await chatService.markAsSeen(activeConversationId);

          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === activeConversationId
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
      togglePinnedMessage: async (conversationId, messageId) => {
        try {
          const { conversation, pinned } = await chatService.togglePinnedMessage(
            conversationId,
            messageId,
          );
          get().updateConversation(conversation);
          playActionSound("success");
          return pinned;
        } catch (error) {
          console.error("Lỗi xảy ra khi ghim tin nhắn trong store", error);
          throw error;
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
          playActionSound("create");

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
          playActionSound("remove");
        } catch (error) {
          console.error(
            "Lỗi xảy ra khi gọi clearConversation trong store",
            error,
          );
        }
      },
      addGroupMembers: async (conversationId, memberIds) => {
        try {
          const conversation = await chatService.addGroupMembers(
            conversationId,
            memberIds,
          );
          get().updateConversation(conversation);
          playActionSound("success");
        } catch (error) {
          console.error("Lỗi xảy ra khi thêm thành viên nhóm trong store", error);
          throw error;
        }
      },
      removeGroupMember: async (conversationId, memberId) => {
        try {
          const conversation = await chatService.removeGroupMember(
            conversationId,
            memberId,
          );
          get().updateConversation(conversation);
          playActionSound("remove");
        } catch (error) {
          console.error("Lỗi xảy ra khi xóa thành viên nhóm trong store", error);
          throw error;
        }
      },
      leaveGroup: async (conversationId) => {
        try {
          await chatService.leaveGroup(conversationId);
          get().removeConversation(conversationId);
          playActionSound("remove");
        } catch (error) {
          console.error("Lỗi xảy ra khi rời nhóm trong store", error);
          throw error;
        }
      },
      disbandGroup: async (conversationId) => {
        try {
          await chatService.disbandGroup(conversationId);
          get().removeConversation(conversationId);
          playActionSound("remove");
        } catch (error) {
          console.error("Lỗi xảy ra khi giải tán nhóm trong store", error);
          throw error;
        }
      },
      renameGroup: async (conversationId, name) => {
        try {
          const conversation = await chatService.renameGroup(conversationId, name);
          get().updateConversation(conversation);
          playActionSound("success");
        } catch (error) {
          console.error("Lỗi xảy ra khi đổi tên nhóm trong store", error);
          throw error;
        }
      },
      uploadGroupAvatar: async (conversationId, file) => {
        try {
          const conversation = await chatService.uploadGroupAvatar(
            conversationId,
            file,
          );
          get().updateConversation(conversation);
          playActionSound("success");
        } catch (error) {
          console.error("Lỗi xảy ra khi upload avatar nhóm trong store", error);
          throw error;
        }
      },
      uploadMessageImage: async (file) => {
        return await chatService.uploadMessageImage(file);
      },
      recallMessage: async (messageId) => {
        try {
          await chatService.recallMessage(messageId);
          playActionSound("remove");
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
      updatePostMessage: async (messageId, title, content, imgUrls = []) => {
        try {
          const updatedMessage = await chatService.updatePostMessage(
            messageId,
            title,
            content,
            imgUrls,
          );

          const { activeConversationId } = get();
          if (updatedMessage?.conversationId) {
            get().handleMessageUpdated(
              updatedMessage,
              updatedMessage.conversationId,
            );
          } else if (activeConversationId) {
            get().handleMessageUpdated(updatedMessage, activeConversationId);
          }
        } catch (error) {
          console.error("Lỗi xảy ra khi updatePostMessage trong store", error);
          throw error;
        }
      },
      handleMessageUpdated: (message, conversationId) => {
        const { user } = useAuthStore.getState();

        set((state) => {
          const convoMessages = state.messages[conversationId];
          const normalizedMessage = {
            ...message,
            isOwn: message.senderId === user?._id,
          };

          const nextConversations = state.conversations.map((convo) => {
            if (
              convo._id === conversationId &&
              convo.lastMessage?._id === message._id
            ) {
              return {
                ...convo,
                lastMessage: {
                  ...convo.lastMessage,
                  content:
                    message.messageType === "post"
                      ? "đã gửi một bài viết"
                      : message.content ?? "",
                  imgUrl: message.imgUrl ?? null,
                  imgUrls: message.imgUrls ?? null,
                  messageType: message.messageType,
                },
              };
            }

            return convo;
          });

          if (!convoMessages) {
            return {
              conversations: sortConversationsByLatest(nextConversations),
            };
          }

          return {
            messages: {
              ...state.messages,
              [conversationId]: {
                ...convoMessages,
                items: convoMessages.items.map((item) =>
                  item._id === message._id
                    ? {
                        ...item,
                        ...normalizedMessage,
                        imgUrl: normalizedMessage.imgUrl ?? null,
                        imgUrls: normalizedMessage.imgUrls ?? [],
                      }
                    : item,
                ),
              },
            },
            conversations: sortConversationsByLatest(nextConversations),
          };
        });
      },
      setReplyingTo: (message) => {
        set({ replyingTo: message });
      },
      reactToMessage: async (messageId, emoji) => {
        try {
          await chatService.reactToMessage(messageId, emoji);
          playActionSound("react");
        } catch (error) {
          console.error("Lỗi xảy ra khi reactToMessage trong store", error);
          throw error;
        }
      },
      handleMessageReaction: (messageId, conversationId, reactions) => {
        set((state) => {
          const convoMessages = state.messages[conversationId];
          if (!convoMessages) return {};

          const updatedItems = convoMessages.items.map((m) =>
            m._id === messageId ? { ...m, reactions } : m
          );

          return {
            messages: {
              ...state.messages,
              [conversationId]: {
                ...convoMessages,
                items: updatedItems,
              },
            },
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
