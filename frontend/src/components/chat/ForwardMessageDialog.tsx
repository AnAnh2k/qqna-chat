import { useEffect, useMemo, useState } from "react";
import { Check, Forward, ImageIcon, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useFriendStore } from "@/stores/useFriendStore";
import type { Conversation, Message } from "@/types/chat";
import GroupChatAvatar from "./GroupChatAvatar";
import UserAvatar from "./UserAvatar";

type ForwardTarget = {
  id: string;
  type: "friend" | "group";
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: Message;
  selectedConvo: Conversation;
};

const getMessagePreview = (message: Message) => {
  if (message.messageType === "post") {
    return message.title ? `Bài viết: ${message.title}` : "Bài viết";
  }

  if (message.content) {
    return message.content;
  }

  if (
    message.imgUrl ||
    (message.imgUrls && message.imgUrls.length > 0)
  ) {
    return "Tin nhắn hình ảnh";
  }

  return "Tin nhắn";
};

const ForwardMessageDialog = ({
  open,
  onOpenChange,
  message,
  selectedConvo,
}: Props) => {
  const { user } = useAuthStore();
  const { friends, getFriends } = useFriendStore();
  const { conversations, forwardMessage } = useChatStore();
  const [query, setQuery] = useState("");
  const [selectedTargets, setSelectedTargets] = useState<ForwardTarget[]>([]);
  const [forwarding, setForwarding] = useState(false);

  useEffect(() => {
    if (open) {
      getFriends();
    }
  }, [getFriends, open]);

  const currentDirectFriendId =
    selectedConvo.type === "direct"
      ? selectedConvo.participants.find((participant) => participant._id !== user?._id)
          ?._id
      : null;

  const normalizedQuery = query.trim().toLowerCase();
  const groupConversations = conversations.filter(
    (conversation) =>
      conversation.type === "group" && conversation._id !== selectedConvo._id,
  );

  const filteredFriends = useMemo(
    () =>
      friends.filter((friend) => {
        if (friend._id === currentDirectFriendId) return false;
        if (!normalizedQuery) return true;

        return (
          friend.displayName.toLowerCase().includes(normalizedQuery) ||
          friend.username.toLowerCase().includes(normalizedQuery)
        );
      }),
    [currentDirectFriendId, friends, normalizedQuery],
  );

  const filteredGroups = useMemo(
    () =>
      groupConversations.filter((conversation) => {
        if (!normalizedQuery) return true;

        return (conversation.group?.name ?? "")
          .toLowerCase()
          .includes(normalizedQuery);
      }),
    [groupConversations, normalizedQuery],
  );

  const isSelected = (target: ForwardTarget) =>
    selectedTargets.some(
      (item) => item.type === target.type && item.id === target.id,
    );

  const toggleTarget = (target: ForwardTarget) => {
    setSelectedTargets((current) =>
      isSelected(target)
        ? current.filter(
            (item) => item.type !== target.type || item.id !== target.id,
          )
        : [...current, target],
    );
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (forwarding) return;
    onOpenChange(nextOpen);

    if (!nextOpen) {
      setQuery("");
      setSelectedTargets([]);
    }
  };

  const handleForward = async () => {
    if (selectedTargets.length === 0) return;

    try {
      setForwarding(true);
      await forwardMessage(message, selectedTargets);
      toast.success("Đã chuyển tiếp tin nhắn");
      handleOpenChange(false);
    } catch {
      toast.error("Không thể chuyển tiếp tin nhắn. Vui lòng thử lại!");
    } finally {
      setForwarding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[min(94vw,520px)] sm:max-w-[520px] gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Forward className="size-4 text-primary" />
            Chuyển tiếp tin nhắn
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            {message.imgUrl || message.imgUrls?.length ? (
              <ImageIcon className="size-3.5" />
            ) : (
              <Forward className="size-3.5" />
            )}
            Nội dung chuyển tiếp
          </div>
          <p className="line-clamp-2 break-words text-sm">
            {getMessagePreview(message)}
          </p>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm bạn bè hoặc nhóm"
            className="pl-8"
          />
        </div>

        <div className="max-h-[52vh] space-y-4 overflow-y-auto pr-1 beautiful-scrollbar">
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-muted-foreground">
              Bạn bè
            </h3>
            {filteredFriends.map((friend) => {
              const target: ForwardTarget = { type: "friend", id: friend._id };
              const selected = isSelected(target);

              return (
                <button
                  key={friend._id}
                  type="button"
                  onClick={() => toggleTarget(target)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border border-transparent p-2 text-left transition-smooth hover:bg-muted/60",
                    selected && "border-primary/30 bg-primary/10",
                  )}
                >
                  <UserAvatar
                    type="sidebar"
                    name={friend.displayName}
                    avatarUrl={friend.avatarUrl}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {friend.displayName}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      @{friend.username}
                    </span>
                  </span>
                  {selected && <Check className="size-4 text-primary" />}
                </button>
              );
            })}
            {filteredFriends.length === 0 && (
              <p className="rounded-lg bg-muted/30 py-4 text-center text-sm text-muted-foreground">
                Không có bạn bè phù hợp
              </p>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-muted-foreground">
              Nhóm
            </h3>
            {filteredGroups.map((conversation) => {
              const target: ForwardTarget = {
                type: "group",
                id: conversation._id,
              };
              const selected = isSelected(target);

              return (
                <button
                  key={conversation._id}
                  type="button"
                  onClick={() => toggleTarget(target)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border border-transparent p-2 text-left transition-smooth hover:bg-muted/60",
                    selected && "border-primary/30 bg-primary/10",
                  )}
                >
                  <GroupChatAvatar
                    participants={conversation.participants}
                    type="sidebar"
                    name={conversation.group?.name}
                    avatarUrl={conversation.group?.avatarUrl}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {conversation.group?.name || "Nhóm không tên"}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {conversation.participants.length} thành viên
                    </span>
                  </span>
                  {selected && <Check className="size-4 text-primary" />}
                </button>
              );
            })}
            {filteredGroups.length === 0 && (
              <p className="rounded-lg bg-muted/30 py-4 text-center text-sm text-muted-foreground">
                Không có nhóm phù hợp
              </p>
            )}
          </div>

          {friends.length === 0 && groupConversations.length === 0 && (
            <div className="rounded-lg bg-muted/30 py-8 text-center text-muted-foreground">
              <Users className="mx-auto mb-2 size-8 opacity-50" />
              Chưa có nơi nào để chuyển tiếp
            </div>
          )}
        </div>

        <DialogFooter className="mt-0">
          <Button
            type="button"
            variant="outline"
            disabled={forwarding}
            onClick={() => handleOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            type="button"
            disabled={selectedTargets.length === 0 || forwarding}
            onClick={handleForward}
          >
            {forwarding
              ? "Đang chuyển..."
              : `Chuyển tiếp (${selectedTargets.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ForwardMessageDialog;
