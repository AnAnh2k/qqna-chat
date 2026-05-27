import { FileText, ImageIcon, Pin, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/stores/useChatStore";
import type {
  Conversation,
  PinnedMessage,
  PinnedMessageContent,
} from "@/types/chat";
import UserAvatar from "./UserAvatar";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation;
};

const getPinnedMessage = (message: PinnedMessage) =>
  typeof message.messageId === "string" ? null : message.messageId;

const getSender = (
  message: PinnedMessageContent | null,
  conversation: Conversation,
) => {
  if (!message) return null;
  if (typeof message.senderId !== "string") return message.senderId;

  return conversation.participants.find(
    (participant) => participant._id === message.senderId,
  );
};

const getPreview = (message: PinnedMessageContent | null) => {
  if (!message) return "Tin nhắn không còn khả dụng";
  if (message.isRecalled) return "Tin nhắn đã được thu hồi";
  if (message.messageType === "post") {
    return message.title ? `Bài viết: ${message.title}` : "Bài viết";
  }
  if (message.content) return message.content;
  if (message.imgUrl || message.imgUrls?.length) return "Tin nhắn hình ảnh";
  return "Tin nhắn";
};

const waitForPaint = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });

const PinnedMessagesDialog = ({
  open,
  onOpenChange,
  conversation,
}: Props) => {
  const pinnedMessages = [...(conversation.pinnedMessages ?? [])].sort(
    (a, b) => new Date(b.pinnedAt).getTime() - new Date(a.pinnedAt).getTime(),
  );

  const scrollToMessage = async (messageId: string) => {
    const { fetchMessages } = useChatStore.getState();
    let target = document.getElementById(`message-${messageId}`);
    let attempts = 0;

    while (!target && attempts < 20) {
      const state = useChatStore.getState();
      const pagination = state.messages[conversation._id];

      if (pagination?.nextCursor === null) {
        break;
      }

      await fetchMessages(conversation._id);
      await waitForPaint();
      target = document.getElementById(`message-${messageId}`);
      attempts += 1;
    }

    if (!target) {
      toast.error("Không tìm thấy tin nhắn ghim trong lịch sử đã tải");
      return;
    }

    onOpenChange(false);
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("bg-primary/10");
    window.setTimeout(() => {
      target?.classList.remove("bg-primary/10");
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,440px)] sm:max-w-[440px] gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pin className="size-4 text-primary" />
            Tin nhắn đã ghim
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[56vh] space-y-2 overflow-y-auto pr-1 beautiful-scrollbar">
          {pinnedMessages.map((pinned) => {
            const message = getPinnedMessage(pinned);
            const sender = getSender(message, conversation);
            const messageId = message?._id;
            const hasImage = !!(message?.imgUrl || message?.imgUrls?.length);
            const isPost = message?.messageType === "post";

            return (
              <button
                key={`${messageId ?? "missing"}-${pinned.pinnedAt}`}
                type="button"
                disabled={!messageId}
                onClick={() => messageId && scrollToMessage(messageId)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border border-border/40 bg-muted/20 p-3 text-left transition-smooth hover:border-primary/30 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                <UserAvatar
                  type="chat"
                  name={sender?.displayName ?? "QQNA"}
                  avatarUrl={sender?.avatarUrl ?? undefined}
                  className="size-8 shrink-0"
                />
                <span className="min-w-0 flex-1">
                  <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    {isPost ? (
                      <FileText className="size-3.5" />
                    ) : hasImage ? (
                      <ImageIcon className="size-3.5" />
                    ) : (
                      <Search className="size-3.5" />
                    )}
                    <span className="truncate">
                      {sender?.displayName ?? "Người dùng"}
                    </span>
                  </span>
                  <span className="line-clamp-2 break-words text-sm font-medium">
                    {getPreview(message)}
                  </span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    Ghim lúc{" "}
                    {new Date(pinned.pinnedAt).toLocaleString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                </span>
              </button>
            );
          })}

          {pinnedMessages.length === 0 && (
            <div className="rounded-lg bg-muted/30 py-8 text-center text-sm text-muted-foreground">
              Chưa có tin nhắn ghim
            </div>
          )}
        </div>

        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Đóng
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default PinnedMessagesDialog;
