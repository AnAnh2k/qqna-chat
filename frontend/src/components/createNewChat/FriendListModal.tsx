import { useFriendStore } from "@/stores/useFriendStore";
import { DialogContent, DialogHeader, DialogTitle, DialogClose } from "../ui/dialog";
import { MessageCircleMore, Users, MessageSquare } from "lucide-react";
import { Card } from "../ui/card";
import { useState } from "react";
import { cn } from "@/lib/utils";
import UserAvatar from "../chat/UserAvatar";
import GroupChatAvatar from "../chat/GroupChatAvatar";
import { useChatStore } from "@/stores/useChatStore";

const FriendListModal = () => {
  const { friends } = useFriendStore();
  const { conversations, createConversation, setActiveConversation } = useChatStore();
  const [activeTab, setActiveTab] = useState<"friends" | "groups">("friends");

  const handleAddConversation = async (friendId: string) => {
    await createConversation("direct", "", [friendId]);
  };

  const handleSelectGroup = (convoId: string) => {
    setActiveConversation(convoId);
  };

  const groupConversations = conversations.filter((c) => c.type === "group");

  return (
    <DialogContent className="max-w-md sm:max-w-md w-full overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl capitalize">
          <MessageCircleMore className="size-5" />
          bắt đầu hội thoại mới
        </DialogTitle>
      </DialogHeader>

      {/* Tabs chuyển đổi giữa bạn bè và danh sách nhóm */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg mb-3 w-full">
        <button
          className={cn(
            "flex-1 py-1.5 text-xs font-semibold rounded-md transition-smooth",
            activeTab === "friends"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("friends")}
        >
          Bạn bè ({friends.length})
        </button>
        <button
          className={cn(
            "flex-1 py-1.5 text-xs font-semibold rounded-md transition-smooth",
            activeTab === "groups"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("groups")}
        >
          Nhóm ({groupConversations.length})
        </button>
      </div>

      {/* Nội dung danh sách tương ứng */}
      <div className="w-full min-w-0">
        {activeTab === "friends" ? (
          <div className="space-y-2 max-h-60 overflow-y-auto p-1 w-full min-w-0 beautiful-scrollbar">
            <h1 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              danh sách bạn bè
            </h1>

            {friends.map((friend) => (
              <DialogClose
                key={friend._id}
                render={
                  <Card
                    onClick={() => handleAddConversation(friend._id)}
                    className="p-3 cursor-pointer transition-smooth hover:shadow-soft hover:bg-muted/30 group/friendCard w-full min-w-0"
                  />
                }
              >
                <div className="flex items-center gap-3 w-full min-w-0">
                  {/* avatar */}
                  <div className="relative">
                    <UserAvatar
                      type="sidebar"
                      name={friend.displayName}
                      avatarUrl={friend.avatarUrl}
                    />
                  </div>

                  {/* info */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <h2 className="font-semibold text-sm truncate">
                      {friend.displayName}
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      @{friend.username}
                    </span>
                  </div>
                </div>
              </DialogClose>
            ))}

            {friends.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="size-12 mx-auto mb-3 opacity-50" />
                Chưa có bạn bè. Thêm bạn vô để tám!
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto p-1 w-full min-w-0 beautiful-scrollbar">
            <h1 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              danh sách nhóm của bạn
            </h1>

            {groupConversations.map((group) => (
              <DialogClose
                key={group._id}
                render={
                  <Card
                    onClick={() => handleSelectGroup(group._id)}
                    className="p-3 cursor-pointer transition-smooth hover:shadow-soft hover:bg-muted/30 group/groupCard w-full min-w-0"
                  />
                }
              >
                <div className="flex items-center gap-3 w-full min-w-0">
                  {/* avatar */}
                  <div className="relative">
                    <GroupChatAvatar
                      participants={group.participants}
                      type="sidebar"
                      name={group.group?.name}
                      avatarUrl={group.group?.avatarUrl}
                    />
                  </div>

                  {/* info */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <h2 className="font-semibold text-sm truncate">
                      {group.group?.name || "Nhóm không tên"}
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      {group.participants.length} thành viên
                    </span>
                  </div>
                </div>
              </DialogClose>
            ))}

            {groupConversations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="size-12 mx-auto mb-3 opacity-50" />
                Chưa tham gia nhóm nào. Hãy tạo nhóm chat mới!
              </div>
            )}
          </div>
        )}
      </div>
    </DialogContent>
  );
};

export default FriendListModal;
