import type { Socket } from "socket.io-client";
import type { Conversation, Message, Reaction } from "./chat";
import type { Friend, FriendRequest, User } from "./user";
import type { UpdateProfilePayload } from "@/services/userService";
import type { MessageSoundId } from "@/lib/notificationSound";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
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
  refresh: (options?: { silent?: boolean }) => Promise<void>;
}

export interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
}

export interface NotificationSettingsState {
  messageSoundEnabled: boolean;
  actionSoundEnabled: boolean;
  messageToastEnabled: boolean;
  desktopNotificationsEnabled: boolean;
  messageSoundId: MessageSoundId;
  soundVolume: number;
  setMessageSoundEnabled: (enabled: boolean) => void;
  setActionSoundEnabled: (enabled: boolean) => void;
  setMessageToastEnabled: (enabled: boolean) => void;
  setDesktopNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setMessageSoundId: (soundId: MessageSoundId) => void;
  setSoundVolume: (volume: number) => void;
}

export interface ChatState {
  conversations: Conversation[];
  messages: Record<
    string,
    {
      items: Message[];
      hasMore: boolean; // infinite-scroll
      nextCursor?: string | null; // phân trang
    }
  >;
  activeConversationId: string | null;
  convoLoading: boolean;
  messageLoading: boolean;
  loading: boolean;
  replyingTo: Message | null;
  reset: () => void;

  setActiveConversation: (id: string | null) => void;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId?: string) => Promise<void>;
  sendDirectMessage: (
    recipientId: string,
    content: string,
    imgUrl?: string,
    title?: string,
    messageType?: string,
    imgUrls?: string[],
    replyTo?: string,
  ) => Promise<void>;
  sendGroupMessage: (
    conversationId: string,
    content: string,
    imgUrl?: string,
    mentionedUserIds?: string[],
    title?: string,
    messageType?: string,
    imgUrls?: string[],
    replyTo?: string,
  ) => Promise<void>;
  // add message
  addMessage: (message: Message) => Promise<void>;
  // update convo
  updateConversation: (
    conversation: Partial<Conversation> & Pick<Conversation, "_id">,
  ) => void;
  removeConversation: (conversationId: string) => void;
  markAsSeen: () => Promise<void>;
  addConvo: (convo: Conversation) => void;
  createConversation: (
    type: "group" | "direct",
    name: string,
    memberIds: string[],
  ) => Promise<void>;
  clearConversation: (conversationId: string) => Promise<void>;
  addGroupMembers: (conversationId: string, memberIds: string[]) => Promise<void>;
  leaveGroup: (conversationId: string) => Promise<void>;
  disbandGroup: (conversationId: string) => Promise<void>;
  renameGroup: (conversationId: string, name: string) => Promise<void>;
  uploadGroupAvatar: (conversationId: string, file: File) => Promise<void>;
  uploadMessageImage: (file: File) => Promise<string>;
  recallMessage: (messageId: string) => Promise<void>;
  handleMessageRecalled: (messageId: string, conversationId: string) => void;
  updatePostMessage: (messageId: string, title: string, content: string, imgUrls?: string[]) => Promise<void>;
  handleMessageUpdated: (message: Message, conversationId: string) => void;
  setReplyingTo: (message: Message | null) => void;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
  handleMessageReaction: (messageId: string, conversationId: string, reactions: Reaction[]) => void;
}

export interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export interface FriendState {
  friends: Friend[];
  loading: boolean;
  receivedList: FriendRequest[];
  sentList: FriendRequest[];
  searchByUsername: (username: string) => Promise<User | null>;
  addFriend: (to: string, message?: string) => Promise<string>;
  getAllFriendRequests: () => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  getFriends: () => Promise<void>;
  unfriend: (friendId: string) => Promise<void>;
}

export interface UserState {
  selectedProfileUser: User | null;
  profileModalOpen: boolean;
  profileLoading: boolean;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  updateAvatarUrl: (formData: FormData) => Promise<void>;
  viewProfile: (userId: string) => Promise<void>;
  setProfileModalOpen: (open: boolean) => void;
}
