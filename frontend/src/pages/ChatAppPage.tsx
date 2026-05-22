import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import ChatWindowLayout from "@/components/chat/ChatWindowLayout";
import { useEffect } from "react";
import { useChatStore } from "@/stores/useChatStore";

const ChatAppPage = () => {
  const { fetchConversations } = useChatStore();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    const handleFocus = () => {
      fetchConversations();
    };

    const intervalId = window.setInterval(() => {
      fetchConversations();
    }, 10000);

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchConversations]);

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
