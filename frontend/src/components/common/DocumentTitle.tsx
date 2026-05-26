import { useEffect, useMemo } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";

const BASE_TITLE = "QQNA Chat";

const DocumentTitle = () => {
  const user = useAuthStore((state) => state.user);
  const conversations = useChatStore((state) => state.conversations);

  const unreadTotal = useMemo(() => {
    if (!user) return 0;

    return conversations.reduce(
      (total, conversation) =>
        total + (conversation.unreadCounts?.[user._id] ?? 0),
      0,
    );
  }, [conversations, user]);

  useEffect(() => {
    document.title =
      unreadTotal > 0 ? `(${unreadTotal}) ${BASE_TITLE}` : BASE_TITLE;

    return () => {
      document.title = BASE_TITLE;
    };
  }, [unreadTotal]);

  return null;
};

export default DocumentTitle;
