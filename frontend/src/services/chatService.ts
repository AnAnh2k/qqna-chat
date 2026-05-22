import type { ConversationResponse } from "@/types/chat";
import api from "@/lib/axios";

export const chatService = {
  async fetchConversations(): Promise<ConversationResponse> {
    const res = await api.get("/conversations");
    return res.data;
  },
  async markAsRead(conversationId: string): Promise<void> {
    await api.patch(`/conversations/${conversationId}/read`);
  },
};
