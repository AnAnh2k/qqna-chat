import api from "@/lib/axios";
import type { ConversationResponse, Message } from "@/types/chat";

interface FetchMessageProps {
  messages: Message[];
  cursor?: string;
}

const pageLimit = 50;

export const chatService = {
  async fetchConversations(): Promise<ConversationResponse> {
    const res = await api.get("/conversations");
    return res.data;
  },

  async fetchMessages(id: string, cursor?: string): Promise<FetchMessageProps> {
    const res = await api.get(
      `/conversations/${id}/messages?limit=${pageLimit}&cursor=${cursor}`,
    );

    return { messages: res.data.messages, cursor: res.data.nextCursor };
  },

  async sendDirectMessage(
    recipientId: string,
    content: string = "",
    imgUrl?: string,
    conversationId?: string,
    title?: string,
    messageType?: string,
    imgUrls?: string[],
    replyTo?: string,
  ) {
    const res = await api.post("/messages/direct", {
      recipientId,
      content,
      imgUrl,
      conversationId,
      title,
      messageType,
      imgUrls,
      replyTo,
    });

    return res.data.message;
  },

  async sendGroupMessage(
    conversationId: string,
    content: string = "",
    imgUrl?: string,
    mentionedUserIds: string[] = [],
    title?: string,
    messageType?: string,
    imgUrls?: string[],
    replyTo?: string,
  ) {
    const res = await api.post("/messages/group", {
      conversationId,
      content,
      imgUrl,
      mentionedUserIds,
      title,
      messageType,
      imgUrls,
      replyTo,
    });
    return res.data.message;
  },
  async reactToMessage(messageId: string, emoji: string) {
    const res = await api.post(`/messages/${messageId}/react`, { emoji });
    return res.data;
  },

  async markAsSeen(conversationId: string) {
    const res = await api.patch(`/conversations/${conversationId}/seen`);
    return res.data;
  },
  async clearConversation(conversationId: string) {
    const res = await api.delete(`/conversations/${conversationId}/clear`);
    return res.data;
  },
  async leaveGroup(conversationId: string) {
    const res = await api.patch(`/conversations/${conversationId}/leave`);
    return res.data.conversation;
  },
  async addGroupMembers(conversationId: string, memberIds: string[]) {
    const res = await api.patch(`/conversations/${conversationId}/members`, {
      memberIds,
    });
    return res.data.conversation;
  },
  async disbandGroup(conversationId: string) {
    const res = await api.delete(`/conversations/${conversationId}/disband`);
    return res.data;
  },
  async renameGroup(conversationId: string, name: string) {
    const res = await api.patch(`/conversations/${conversationId}/name`, { name });
    return res.data.conversation;
  },
  async uploadGroupAvatar(conversationId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.patch(
      `/conversations/${conversationId}/avatar`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return res.data.conversation;
  },
  async createConversation(
    type: "direct" | "group",
    name: string,
    memberIds: string[],
  ) {
    const res = await api.post("/conversations", { type, name, memberIds });
    return res.data.conversation;
  },
  async recallMessage(messageId: string) {
    const res = await api.delete(`/messages/${messageId}`);
    return res.data;
  },
  async updatePostMessage(messageId: string, title: string, content: string) {
    const res = await api.patch(`/messages/${messageId}/post`, {
      title,
      content,
    });
    return res.data.message;
  },
  async uploadMessageImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/messages/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data.imgUrl;
  },
};
