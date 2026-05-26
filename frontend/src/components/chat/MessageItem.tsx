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
import { MoreHorizontal, Undo2, X, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import ConfirmDialog from "../common/ConfirmDialog";

interface MessageItemProps {
  message: Message;
  index: number;
  messages: Message[];
  selectedConvo: Conversation;
  lastMessageStatus: "delivered" | "seen";
}

const mentionAllLabel = "mọi người";

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [recallConfirmOpen, setRecallConfirmOpen] = useState(false);
  const [recalling, setRecalling] = useState(false);
  const [postReaderOpen, setPostReaderOpen] = useState(false);

  const handleRecall = async () => {
    try {
      setRecalling(true);
      await recallMessage(message._id);
      setRecallConfirmOpen(false);
      toast.success("Thu hồi tin nhắn thành công");
    } catch {
      toast.error("Không thể thu hồi tin nhắn. Vui lòng thử lại!");
    } finally {
      setRecalling(false);
    }
  };

  const isShowTime =
    index === messages.length - 1 ||
    new Date(message.createdAt).getTime() -
      new Date(prev?.createdAt || 0).getTime() >
      300000; // 5 phút

  const isGroupBreak = isShowTime || message.senderId !== prev?.senderId;

  const participant = selectedConvo.participants.find(
    (p: Participant) => p._id.toString() === message.senderId.toString(),
  );

  const mentionLabels = [
    mentionAllLabel,
    ...selectedConvo.participants.map((member) => member.displayName),
  ]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  const renderMessageContent = (content: string) => {
    if (mentionLabels.length === 0) {
      return content;
    }

    const mentionPattern = new RegExp(
      `(@(?:${mentionLabels.map(escapeRegExp).join("|")}))`,
      "gi",
    );

    return content.split(mentionPattern).map((part, partIndex) => {
      const isMention = mentionLabels.some(
        (label) => part.toLowerCase() === `@${label.toLowerCase()}`,
      );

      if (!isMention) {
        return <span key={`${part}-${partIndex}`}>{part}</span>;
      }

      return (
        <span
          key={`${part}-${partIndex}`}
          className={cn(
            "mx-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
            message.isOwn
              ? "bg-white/20 text-white ring-1 ring-white/25"
              : "bg-primary/10 text-primary ring-1 ring-primary/15",
          )}
        >
          {part}
        </span>
      );
    });
  };

  if (message.messageType === "system") {
    return (
      <div className="flex w-full justify-center px-4 py-2">
        <span className="max-w-[80%] rounded-full bg-muted px-3 py-1 text-center text-xs font-medium text-muted-foreground">
          {message.content}
        </span>
      </div>
    );
  }

  // Tin nhắn chỉ có ảnh (không có text) — không dùng Card bubble
  const isImageOnly = !!message.imgUrl && !message.content && !message.isRecalled;

  return (
    <>
      {/* Lightbox fullscreen */}
      {lightboxOpen && message.imgUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="size-5" />
          </button>
          <img
            src={message.imgUrl}
            alt="Ảnh phóng to"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className={cn("flex flex-col w-full", isImageOnly && "mb-2")}>
        {/* time */}
        {isShowTime && (
          <span className="flex justify-center text-xs text-muted-foreground px-1 py-2">
            {formatMessageTime(new Date(message.createdAt))}
          </span>
        )}

        <div
          className={cn(
            "flex gap-2 message-bounce",
            message.isOwn ? "justify-end" : "justify-start",
            isImageOnly ? "mt-3" : "mt-1",
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
              {/* Trường hợp chỉ có ảnh — render trực tiếp không có Card */}
              {isImageOnly ? (
                <button
                  onClick={() => setLightboxOpen(true)}
                  className="focus:outline-none cursor-zoom-in"
                  title="Xem ảnh phóng to"
                >
                  <img
                    src={message.imgUrl!}
                    alt="Ảnh tin nhắn"
                    className="max-w-[240px] max-h-[320px] w-full object-cover rounded-2xl shadow-md hover:opacity-90 transition-opacity block"
                  />
                </button>
              ) : message.messageType === "post" && !message.isRecalled ? (
                <Card
                  onClick={() => setPostReaderOpen(true)}
                  className={cn(
                    "cursor-pointer hover:shadow-soft transition-all duration-300 border border-primary/20 bg-gradient-glass p-3.5 flex flex-col gap-2 min-w-[220px] max-w-[280px] rounded-2xl shadow-sm",
                    message.isOwn ? "chat-bubble-sent border-0" : "chat-bubble-received border-border/40"
                  )}
                >
                  <div className="flex items-center gap-1.5 border-b border-primary/10 pb-1.5 select-none">
                    <FileText className="size-3.5 text-primary shrink-0" />
                    <span className="font-bold text-[10px] uppercase tracking-wider text-primary">
                      Bài Viết
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-foreground line-clamp-2 break-all leading-snug">
                    {message.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-3 break-all leading-relaxed whitespace-pre-line">
                    {message.content}
                  </p>
                  <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-border/30 select-none">
                    <span className="text-[10px] text-muted-foreground/80 font-medium">
                      Tác giả: {message.isOwn ? "Bạn" : (participant?.displayName || "QQNA")}
                    </span>
                    <span className="text-[10px] text-primary font-bold hover:underline">
                      Đọc tiếp &rarr;
                    </span>
                  </div>
                </Card>
              ) : (
                <Card
                  className={cn(
                    "gap-0 overflow-hidden py-0 transition-all duration-300",
                    message.isRecalled
                      ? "px-3 py-2 bg-muted/30 border border-dashed border-border/40 text-muted-foreground/80 italic select-none"
                      : message.isOwn
                        ? "chat-bubble-sent border-0"
                        : "chat-bubble-received",
                  )}
                >
                  {message.isRecalled ? (
                    <p className="text-sm leading-snug break-words">
                      Tin nhắn đã được thu hồi
                    </p>
                  ) : (
                    <>
                      {/* Ảnh kèm text — click ảnh để phóng to */}
                      {message.imgUrl && (
                        <button
                          onClick={() => setLightboxOpen(true)}
                          className="focus:outline-none cursor-zoom-in block w-full"
                          title="Xem ảnh phóng to"
                        >
                          <img
                            src={message.imgUrl}
                            alt="Ảnh tin nhắn"
                            className="max-w-[240px] max-h-[320px] w-full object-cover block hover:opacity-90 transition-opacity"
                            style={{ borderRadius: "0.75rem 0.75rem 0 0" }}
                          />
                        </button>
                      )}
                      {message.content && (
                        <p className="text-sm leading-snug break-words px-2.5 py-1.5">
                          {renderMessageContent(message.content)}
                        </p>
                      )}
                    </>
                  )}
                </Card>
              )}

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
                          onClick={() => setRecallConfirmOpen(true)}
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

      <ConfirmDialog
        open={recallConfirmOpen}
        onOpenChange={setRecallConfirmOpen}
        title="Thu hồi tin nhắn"
        description="Bạn có chắc chắn muốn thu hồi tin nhắn này không?"
        confirmText="Thu hồi"
        variant="destructive"
        loading={recalling}
        icon={Undo2}
        onConfirm={handleRecall}
      />
      <Dialog open={postReaderOpen} onOpenChange={setPostReaderOpen}>
        <DialogContent className="sm:max-w-[50vw] bg-gradient-glass border-border/40 p-6 flex flex-col max-h-[85vh]">
          <DialogHeader className="mb-2 shrink-0 border-b border-border/40 pb-4">
            <DialogTitle className="text-xl font-black text-slate-800 dark:text-slate-100 break-all leading-snug flex items-start gap-2.5">
              <FileText className="size-6 text-primary shrink-0 mt-0.5" />
              <span>{message.title}</span>
            </DialogTitle>
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <UserAvatar
                type="chat"
                name={participant?.displayName ?? (message.isOwn ? "Bạn" : "QQNA")}
                avatarUrl={participant?.avatarUrl ?? undefined}
                className="size-5 shrink-0"
              />
              <span className="font-semibold text-foreground">
                {message.isOwn ? "Bạn" : (participant?.displayName || "QQNA")}
              </span>
              <span>•</span>
              <span>Đăng lúc {new Date(message.createdAt).toLocaleString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
              })}</span>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-2 pr-1 beautiful-scrollbar min-h-0">
            <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap break-words font-normal">
              {message.content}
            </div>
          </div>

          <DialogFooter className="mt-4 shrink-0 border-t border-border/40 pt-4 flex sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPostReaderOpen(false)}
              className="px-5 font-semibold text-xs rounded-lg"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MessageItem;
