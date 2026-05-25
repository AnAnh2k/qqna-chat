import { useChatStore } from "@/stores/useChatStore";
import DirectMessageCard from "./DirectMessageCard";

const getConversationTime = (convo: any) => {
  const timestamp =
    convo.lastMessageAt ??
    convo.lastMessage?.createdAt ??
    convo.updatedAt ??
    convo.createdAt;

  return timestamp ? new Date(timestamp).getTime() : 0;
};

const DirectMessageList = () => {
  const { conversations } = useChatStore();

  if (!conversations) return;

  const directConversations = conversations.filter(
    (convo) => convo.type === "direct" && !convo.isCleared
  ).sort((a, b) => getConversationTime(b) - getConversationTime(a));

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-2">
      {directConversations.map((convo) => (
        <DirectMessageCard
          convo={convo}
          key={convo._id}
        />
      ))}
    </div>
  );
};

export default DirectMessageList;
