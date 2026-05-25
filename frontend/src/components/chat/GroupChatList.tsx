import { useChatStore } from "@/stores/useChatStore";
import GroupChatCard from "./GroupChatCard";

const getConversationTime = (convo: any) => {
  const timestamp =
    convo.lastMessageAt ??
    convo.lastMessage?.createdAt ??
    convo.updatedAt ??
    convo.createdAt;

  return timestamp ? new Date(timestamp).getTime() : 0;
};

const GroupChatList = () => {
  const { conversations } = useChatStore();

  if (!conversations) return;

  const groupchats = conversations.filter(
    (convo) => convo.type === "group" && !convo.isCleared
  ).sort((a, b) => getConversationTime(b) - getConversationTime(a));
  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-2">
      {groupchats.map((convo) => (
        <GroupChatCard
          convo={convo}
          key={convo._id}
        />
      ))}
    </div>
  );
};

export default GroupChatList;
