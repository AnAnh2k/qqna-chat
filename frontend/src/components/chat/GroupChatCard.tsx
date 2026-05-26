import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import type { Conversation, Participant } from "@/types/chat";
import ChatCard from "./ChatCard";
import UnreadCountBadge from "./UnreadCountBadge";
import GroupChatAvatar from "./GroupChatAvatar";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type LastMessagePreview = NonNullable<Conversation["lastMessage"]> & {
  senderId?: string | { _id?: string; displayName?: string };
};

// Helper: lấy senderId bất kể từ DB path (senderId populated) hay socket path (sender._id)
const getSenderId = (lastMsg?: LastMessagePreview | null): string => {
  if (!lastMsg) return "";
  const raw = lastMsg.senderId;
  if (raw && typeof raw === "object") return raw._id?.toString() ?? "";
  if (raw) return raw.toString();
  return typeof lastMsg.sender === "string"
    ? lastMsg.sender
    : lastMsg.sender?._id?.toString() ?? "";
};

// Helper: lấy sender displayName từ DB path hoặc socket path
const getSenderDisplayName = (
  lastMsg: LastMessagePreview | null,
  participants: Participant[],
): string => {
  if (!lastMsg) return "";
  // DB path: senderId là populated object có displayName
  const raw = lastMsg.senderId;
  if (raw && typeof raw === "object" && raw.displayName) return raw.displayName;
  // Socket path: sender.displayName đã được lookup từ participants
  if (typeof lastMsg.sender !== "string" && lastMsg.sender?.displayName) {
    return lastMsg.sender.displayName;
  }
  // Fallback: tìm trong participants theo ID
  const id = getSenderId(lastMsg);
  const p = participants.find((p) => p._id?.toString() === id);
  return p?.displayName ?? "";
};

const GroupChatCard = ({ convo }: { convo: Conversation }) => {
  const { user } = useAuthStore();
  const {
    activeConversationId,
    setActiveConversation,
    messages,
    fetchMessages,
  } = useChatStore();

  if (!user) return null;

  const unreadCount = convo.unreadCounts?.[user._id] ?? 0;
  const name = convo.group?.name ?? "";
  const hasImage = !!convo.lastMessage?.imgUrl;
  const lastContent = convo.lastMessage?.content ?? "";
  // Trường hợp ảnh gửi trước khi fix backend: lastMessage có nhưng content và imgUrl đều rỗng
  const isLikelyImageOnly =
    !!convo.lastMessage && !lastContent && !hasImage;

  // Xác định người gửi & prefix hiển thị
  const senderId = getSenderId(convo.lastMessage);
  const isOwn = !!senderId && senderId === user._id?.toString();
  const senderDisplayName = isOwn
    ? "Bạn"
    : getSenderDisplayName(convo.lastMessage, convo.participants);
  const prefix = convo.lastMessage ? `${senderDisplayName}: ` : "";

  const handleSelectConversation = async (id: string) => {
    setActiveConversation(id);
    if (!messages[id]) {
      await fetchMessages();
    }
  };

  return (
    <ChatCard
      convoId={convo._id}
      name={name}
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
          <GroupChatAvatar
            participants={convo.participants}
            type="chat"
            name={convo.group?.name}
            avatarUrl={convo.group?.avatarUrl}
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
          {/* Chưa có tin nhắn nào */}
          {!hasImage && !lastContent && (
            <span>{convo.participants.length} thành viên</span>
          )}
        </p>
      }
    />
  );
};

export default GroupChatCard;
