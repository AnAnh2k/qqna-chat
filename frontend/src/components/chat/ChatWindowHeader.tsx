import { useChatStore } from "@/stores/useChatStore";
import type { Conversation, Participant } from "@/types/chat";
import { SidebarTrigger } from "../ui/sidebar";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUserStore } from "@/stores/useUserStore";
import { Separator } from "../ui/separator";
import UserAvatar from "./UserAvatar";
import GroupChatAvatar from "./GroupChatAvatar";
import StatusBadge from "./StatusBadge";
import { useSocketStore } from "@/stores/useSocketStore";
import { useState } from "react";
import { Pin, Users } from "lucide-react";
import GroupMembersDialog from "./GroupMembersDialog";
import PinnedMessagesDialog from "./PinnedMessagesDialog";
import { Button } from "../ui/button";

const ChatWindowHeader = ({ chat }: { chat?: Conversation }) => {
  const { conversations, activeConversationId } = useChatStore();
  const { user } = useAuthStore();
  const { viewProfile } = useUserStore();
  const { onlineUsers } = useSocketStore();
  const [membersOpen, setMembersOpen] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);

  let otherUser: Participant | null = null;

  chat = chat ?? conversations.find((c) => c._id === activeConversationId);

  if (!chat) {
    return (
      <header className="md:hidden sticky top-0 z-10 flex items-center gap-2 px-4 py-2 w-full">
        <SidebarTrigger className="-ml-1 text-foreground" />
      </header>
    );
  }

  if (chat.type === "direct") {
    const otherUsers = chat.participants.filter((p) => p._id !== user?._id);
    otherUser = otherUsers.length > 0 ? otherUsers[0] : null;

    if (!user || !otherUser) return null;
  }

  const pinnedCount = chat.pinnedMessages?.length ?? 0;

  return (
    <>
      <header className="sticky top-0 z-10 px-4 py-2 flex items-center bg-background border-b border-border/40">
        <div className="flex items-center gap-2 w-full">
          <SidebarTrigger className="-ml-1 text-foreground" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />

          <div className="p-2 w-full flex items-center gap-3">
            {/* avatar */}
            <div className="relative">
              {chat.type === "direct" ? (
                <>
                  <button
                    onClick={() => viewProfile(otherUser!._id)}
                    className="focus:outline-none cursor-pointer hover:opacity-85 transition-smooth"
                  >
                    <UserAvatar
                      type={"sidebar"}
                      name={otherUser?.displayName || "QQNA"}
                      avatarUrl={otherUser?.avatarUrl || undefined}
                    />
                  </button>
                  {/* status badge */}
                  <StatusBadge
                    status={
                      onlineUsers.includes(otherUser?._id ?? "")
                        ? "online"
                        : "offline"
                    }
                  />
                </>
              ) : (
                <button
                  onClick={() => setMembersOpen(true)}
                  className="focus:outline-none cursor-pointer hover:opacity-85 transition-smooth"
                >
                  <GroupChatAvatar
                    participants={chat.participants}
                    type="sidebar"
                    name={chat.group?.name}
                    avatarUrl={chat.group?.avatarUrl}
                  />
                </button>
              )}
            </div>

            {/* name & members count if group */}
            <div className="flex flex-col">
              <h2 className="font-semibold text-foreground">
                {chat.type === "direct" ? otherUser?.displayName : chat.group?.name}
              </h2>
              {chat.type === "group" && (
                <button
                  onClick={() => setMembersOpen(true)}
                  className="text-xs text-muted-foreground hover:text-primary transition-smooth text-left cursor-pointer flex items-center gap-1 mt-0.5"
                >
                  <Users className="size-3" />
                  <span>{chat.participants.length} thành viên</span>
                </button>
              )}
            </div>

            {pinnedCount > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPinnedOpen(true)}
                className="ml-auto h-8 shrink-0 gap-1.5 rounded-lg px-2.5 text-xs font-semibold"
              >
                <Pin className="size-3.5" />
                Ghim
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                  {pinnedCount}
                </span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <GroupMembersDialog
        open={membersOpen}
        setOpen={setMembersOpen}
        conversation={chat}
      />
      <PinnedMessagesDialog
        open={pinnedOpen}
        onOpenChange={setPinnedOpen}
        conversation={chat}
      />
    </>
  );
};

export default ChatWindowHeader;
