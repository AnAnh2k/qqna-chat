export interface Participant {
  _id: string;
  displayName: string;
  avatarUrl?: string | null;
  joinedAt: string;
}

export interface SeenUser {
  userId: {
    _id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  seenAt: string;
  messageId: string;
}

export interface Group {
  name: string;
  createdBy: string;
}

export interface LastMessage {
  _id: string;
  content: string;
  imgUrl?: string | null;
  imgUrls?: string[] | null;
  createdAt: string;
  sender: {
    _id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
}

export interface Conversation {
  _id: string;
  type: "direct" | "group";
  group: Group;
  participants: Participant[];
  lastMessageAt: string;
  seenBy: SeenUser[];
  lastMessage: LastMessage | null;
  unreadCounts: Record<string, number>; // key = userId, value = unread count
  createdAt: string;
  updatedAt: string;
  isCleared?: boolean;
}

export interface ConversationResponse {
  conversations: Conversation[];
}

export interface Reaction {
  userId: string;
  emoji: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  messageType?: "user" | "system" | "post";
  imgUrl?: string | null;
  imgUrls?: string[] | null;
  mentions?: string[];
  isRecalled?: boolean;
  updatedAt?: string | null;
  createdAt: string;
  isOwn?: boolean;
  replyTo?: Message | null;
  reactions?: Reaction[];
}
