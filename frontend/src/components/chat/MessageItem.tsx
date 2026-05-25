import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { useUserStore } from "@/stores/useUserStore";
import { useChatStore } from "@/stores/useChatStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { MoreHorizontal, Undo2 } from "lucide-react";
import { toast } from "sonner";

interface MessageItemProps {
  message: Message;
  index: number;
  messages: Message[];
  selectedConvo: Conversation;
  lastMessageStatus: "delivered" | "seen";
}

const MessageItem = ({
  message,
  index,
  messages,
  selectedConvo,
  lastMessageStatus,
}: MessageItemProps) => {
  const { viewProfile } = useUserStore();
  const recallMessage = useChatStore((s) => s.recallMessage);
  const prev = index + 1 < messages.length ? messages[index + 1] : undefined;

  const handleRecall = async () => {
    const confirm = window.confirm("Bạn có chắc chắn muốn thu hồi tin nhắn này?");
    if (!confirm) return;
    try {
      await recallMessage(message._id);
      toast.success("Thu hồi tin nhắn thành công");
    } catch (err) {
      toast.error("Không thể thu hồi tin nhắn. Vui lòng thử lại!");
    }
  };

  const isShowTime =
    index === 0 ||
    new Date(message.createdAt).getTime() -
      new Date(prev?.createdAt || 0).getTime() >
      300000; // 5 phút

  const isGroupBreak = isShowTime || message.senderId !== prev?.senderId;

  const participant = selectedConvo.participants.find(
    (p: Participant) => p._id.toString() === message.senderId.toString(),
  );

  return (
    <div className="flex flex-col w-full">
      {/* time */}
      {isShowTime && (
        <span className="flex justify-center text-xs text-muted-foreground px-1 py-2">
          {formatMessageTime(new Date(message.createdAt))}
        </span>
      )}

      <div
        className={cn(
          "flex gap-2 message-bounce mt-1",
          message.isOwn ? "justify-end" : "justify-start",
        )}
      >
        {/* avatar */}
        {!message.isOwn && (
          <div className="w-8">
            {isGroupBreak && (
              <button
                onClick={() => viewProfile(message.senderId)}
                className="focus:outline-none cursor-pointer hover:opacity-85 transition-smooth"
              >
                <UserAvatar
                  type="chat"
                  name={participant?.displayName ?? "QQNA"}
                  avatarUrl={participant?.avatarUrl ?? undefined}
                />
              </button>
            )}
          </div>
        )}

        {/* tin nhắn */}
        <div
          className={cn(
            "max-w-xs lg:max-w-md space-y-1 flex flex-col",
            message.isOwn ? "items-end" : "items-start",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2 group/msg relative",
              message.isOwn ? "flex-row-reverse" : "flex-row",
            )}
          >
            <Card
              className={cn(
                "p-3 transition-all duration-300",
                message.isRecalled
                  ? "bg-muted/30 border border-dashed border-border/40 text-muted-foreground/80 italic select-none"
                  : message.isOwn
                    ? "chat-bubble-sent border-0"
                    : "chat-bubble-received",
              )}
            >
              <p className="text-sm leading-relaxed break-words">
                {message.isRecalled ? "Tin nhắn đã được thu hồi" : message.content}
              </p>
            </Card>

            {/* Time & Recall Action on Hover */}
            {!message.isRecalled && (
              <div
                className={cn(
                  "flex items-center gap-1.5 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200 text-[10px] text-muted-foreground shrink-0",
                  message.isOwn ? "flex-row-reverse" : "flex-row",
                )}
              >
                <span>
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </span>

                {message.isOwn && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 p-0 hover:bg-muted rounded-full focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      }
                    >
                      <MoreHorizontal className="size-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align={message.isOwn ? "end" : "start"}
                      className="w-28 min-w-[7rem]"
                    >
                      <DropdownMenuItem
                        onClick={handleRecall}
                        className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer text-xs gap-1.5"
                      >
                        <Undo2 className="size-3.5" />
                        Thu hồi
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>

          {/* seen/ delivered */}
          {message.isOwn && message._id === selectedConvo.lastMessage?._id && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs px-1.5 py-0.5 h-4 border-0",
                lastMessageStatus === "seen"
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {lastMessageStatus}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
