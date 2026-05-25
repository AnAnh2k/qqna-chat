import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import type { SocketState } from "@/types/store";
import { useChatStore } from "./useChatStore";
import { useFriendStore } from "./useFriendStore";
import { toast } from "sonner";

const baseURL = import.meta.env.VITE_SOCKET_URL;

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],
  connectSocket: () => {
    const accessToken = useAuthStore.getState().accessToken;
    const existingSocket = get().socket;

    if (existingSocket) return; // tránh tạo nhiều socket

    const socket: Socket = io(baseURL, {
      auth: { token: accessToken },
      transports: ["websocket"],
    });

    set({ socket });

    socket.on("connect", () => {
      console.log("Đã kết nối với socket");
    });

    // online users
    socket.on("online-users", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // new message
    socket.on("new-message", ({ message, conversation, unreadCounts }) => {
      useChatStore.getState().addMessage(message);

      // Tìm thông tin người gửi từ danh sách participants trong store
      const existingConvo = useChatStore
        .getState()
        .conversations.find((c) => c._id === conversation._id);
      const senderParticipant = existingConvo?.participants.find(
        (p) => p._id?.toString() === message.senderId?.toString(),
      );

      const lastMessage = {
        _id: conversation.lastMessage._id,
        content: conversation.lastMessage.content,
        imgUrl: conversation.lastMessage.imgUrl ?? null,
        createdAt: conversation.lastMessage.createdAt,
        sender: {
          _id: message.senderId?.toString() ?? "",
          displayName: senderParticipant?.displayName ?? "",
          avatarUrl: senderParticipant?.avatarUrl ?? null,
        },
      };

      const updatedConversation = {
        ...conversation,
        lastMessage,
        unreadCounts,
      };

      if (
        useChatStore.getState().activeConversationId === message.conversationId
      ) {
        useChatStore.getState().markAsSeen();
      }

      useChatStore.getState().updateConversation(updatedConversation);
    });

    // read message
    socket.on("read-message", ({ conversation, lastMessage }) => {
      const updated = {
        _id: conversation._id,
        lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        unreadCounts: conversation.unreadCounts,
        seenBy: conversation.seenBy,
      };

      useChatStore.getState().updateConversation(updated);
    });

    // new group chat
    socket.on("new-group", (conversation) => {
      useChatStore.getState().addConvo(conversation);
      socket.emit("join-conversation", conversation._id);
    });

    socket.on("group-updated", (conversation) => {
      useChatStore.getState().updateConversation(conversation);
    });

    socket.on("mention-notification", ({ senderName, conversationName }) => {
      toast.info(
        `${senderName} đã nhắc đến bạn trong cuộc trò chuyện ${conversationName}`,
        { duration: Infinity },
      );
    });

    socket.on("group-removed", ({ conversationId }) => {
      socket.emit("leave-conversation", conversationId);
      useChatStore.getState().removeConversation(conversationId);
    });

    // message recalled
    socket.on("message-recalled", ({ messageId, conversationId }) => {
      useChatStore.getState().handleMessageRecalled(messageId, conversationId);
    });

    // new friend request
    socket.on("new-friend-request", (request) => {
      useFriendStore.setState((state) => ({
        receivedList: [request, ...state.receivedList],
      }));
      toast.success(`${request.from.displayName} đã gửi lời mời kết bạn!`);
    });

    // friend request accepted
    socket.on("friend-request-accepted", ({ newFriend, requestId }) => {
      useFriendStore.setState((state) => {
        const exists = state.friends.some((f) => f._id === newFriend._id);
        return {
          friends: exists ? state.friends : [newFriend, ...state.friends],
          receivedList: state.receivedList.filter((r) => r._id !== requestId),
          sentList: state.sentList.filter((r) => r._id !== requestId),
        };
      });
      toast.success(`${newFriend.displayName} và bạn đã trở thành bạn bè!`);
    });

    // friend request declined
    socket.on("friend-request-declined", ({ requestId }) => {
      useFriendStore.setState((state) => ({
        receivedList: state.receivedList.filter((r) => r._id !== requestId),
        sentList: state.sentList.filter((r) => r._id !== requestId),
      }));
    });

    // unfriended
    socket.on("unfriended", ({ friendId }) => {
      useFriendStore.setState((state) => ({
        friends: state.friends.filter((f) => f._id !== friendId),
      }));
    });
  },
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
