import type { Conversation, Message } from "./chat";
import type { User } from "./user";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  setAccessToken: (accessToken: string) => void;

  clearState: () => void;

  signUp: (
    username: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;

  signIn: (username: string, password: string) => Promise<void>;

  signOut: () => Promise<void>;

  fetchMe: () => Promise<void>;

  refresh: () => Promise<string>;
}

export interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
}

export interface ChatState {
  conversations: Conversation[];
  messages: Record<
    string,
    {
      items: Message[];
      hasMore: boolean; // có còn tin nhắn nào nữa để tải không
      nextCursor: string | null; // cursor để tải trang tiếp theo, có thể là timestamp hoặc messageId của tin nhắn cuối cùng
    }
  >;
  activeConversationId: string | null;
  loading: boolean;
  reset: () => void;
  setActiveConversation: (id: string | null) => void;
  fetchConversations: () => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
}
