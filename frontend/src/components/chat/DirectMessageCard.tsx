import type { Conversation, Participant } from "@/types/chat";
import ChatCard from "./ChatCard";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { cn } from "@/lib/utils";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import UnreadCountBadge from "./UnreadCountBadge";
import { useSocketStore } from "@/stores/useSocketStore";
import { ImageIcon } from "lucide-react";

// Helper: lấy senderId bất kể từ DB path (senderId populated) hay socket path (sender._id)
const getSenderId = (lastMsg: any): string => {
  if (!lastMsg) return "";
  const raw = lastMsg.senderId;
  if (raw && typeof raw === "object") return raw._id?.toString() ?? "";
  if (raw) return raw.toString();
  return lastMsg.sender?._id?.toString() ?? "";
};

const DirectMessageCard = ({ convo }: { convo: Conversation }) => {
  const { user } = useAuthStore();
  const { onlineUsers } = useSocketStore();
  const {
    activeConversationId,
    setActiveConversation,
    messages,
    fetchMessages,
  } = useChatStore();

  if (!user) return null;

  const otherUser = convo.participants.find((p) => p._id !== user._id);

  if (!otherUser) return null;

  const unreadCount = convo.unreadCounts?.[user._id] ?? 0;
  const hasImage = !!convo.lastMessage?.imgUrl;
  const lastContent = convo.lastMessage?.content ?? "";
  // Trường hợp ảnh gửi trước khi fix backend: lastMessage có nhưng content và imgUrl đều rỗng
  const isLikelyImageOnly =
    !!convo.lastMessage && !lastContent && !hasImage;

  // Xác định người gửi tin nhắn cuối
  const senderId = getSenderId(convo.lastMessage);
  const isOwn = !!senderId && senderId === user._id?.toString();
  const prefix = isOwn ? "Bạn: " : "";

  const handleSelectConversation = async (id: string) => {
    setActiveConversation(id);
    if (!messages[id]) {
      await fetchMessages();
    }
  };

  return (
    <ChatCard
      convoId={convo._id}
      name={otherUser.displayName ?? ""}
      timestamp={
        convo.lastMessage?.createdAt
          ? new Date(convo.lastMessage.createdAt)
          : undefined
      }
      isActive={activeConversationId === convo._id}
      onSelect={handleSelectConversation}
      unreadCount={unreadCount}
      leftSection={
        <>
          {unreadCount > 0 && <UnreadCountBadge unreadCount={unreadCount} />}
          <UserAvatar
            type="sidebar"
            name={otherUser.displayName ?? ""}
            avatarUrl={otherUser.avatarUrl ?? undefined}
          />
          <StatusBadge
            status={
              onlineUsers.includes(otherUser?._id ?? "") ? "online" : "offline"
            }
          />
        </>
      }
      subtitle={
        <p
          className={cn(
            "text-sm truncate flex items-center gap-1",
            unreadCount > 0
              ? "font-medium text-foreground"
              : "text-muted-foreground",
          )}
        >
          {/* Ảnh (có imgUrl mới hoặc ảnh cũ không có imgUrl) không có text */}
          {(hasImage || isLikelyImageOnly) && !lastContent && (
            <>
              <ImageIcon className="size-3.5 shrink-0" />
              <span className="truncate">{prefix}Đã gửi 1 ảnh</span>
            </>
          )}
          {/* Ảnh kèm text */}
          {hasImage && lastContent && (
            <>
              <ImageIcon className="size-3.5 shrink-0" />
              <span className="truncate">{prefix}{lastContent}</span>
            </>
          )}
          {/* Chỉ text */}
          {!hasImage && !isLikelyImageOnly && lastContent && (
            <span className="truncate">{prefix}{lastContent}</span>
          )}
        </p>
      }
    />
  );
};

export default DirectMessageCard;
