import ChatWindowLayout from "@/components/chat/ChatWindowLayout";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useEffect } from "react";

const ChatAppPage = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const fetchConversations = useChatStore((state) => state.fetchConversations);

  useEffect(() => {
    if (!accessToken) return;

    fetchConversations();

    const syncConversations = () => {
      if (document.visibilityState === "visible") {
        fetchConversations();
      }
    };

    window.addEventListener("focus", fetchConversations);
    document.addEventListener("visibilitychange", syncConversations);

    return () => {
      window.removeEventListener("focus", fetchConversations);
      document.removeEventListener("visibilitychange", syncConversations);
    };
  }, [accessToken, fetchConversations]);

  return (
    <SidebarProvider>
      <AppSidebar />

      <div className="flex h-screen w-full p-2">
        <ChatWindowLayout />
      </div>
    </SidebarProvider>
  );
};

export default ChatAppPage;
