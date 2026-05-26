import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { useUserStore } from "@/stores/useUserStore";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { MoreHorizontal, Undo2, X, FileText, ChevronLeft, ChevronRight, CornerUpLeft, Smile } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { toast } from "sonner";
import { useState, useEffect } from "react";
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
  const { recallMessage, reactToMessage, setReplyingTo } = useChatStore();
  const { user } = useAuthStore();
  const readersWhoSeenThis = (selectedConvo.seenBy ?? []).filter(
    (s) => s.userId?._id !== user?._id && s.messageId === message._id
  );
  const prev = index + 1 < messages.length ? messages[index + 1] : undefined;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
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

  const allImages =
    message.imgUrls && message.imgUrls.length > 0
      ? message.imgUrls
      : message.imgUrl
        ? [message.imgUrl]
        : [];

  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxOpen(false);
      } else if (e.key === "ArrowLeft" && allImages.length > 1) {
        setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
      } else if (e.key === "ArrowRight" && allImages.length > 1) {
        setActiveImageIndex((prev) => (prev + 1) % allImages.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, allImages.length]);

  const renderImageGrid = (roundedTopOnly: boolean) => {
    if (allImages.length === 0) return null;

    if (allImages.length === 1) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveImageIndex(0);
            setLightboxOpen(true);
          }}
          className="focus:outline-none cursor-zoom-in block w-full overflow-hidden"
          style={{
            borderRadius: roundedTopOnly ? "0.75rem 0.75rem 0 0" : "1rem",
          }}
          title="Xem ảnh phóng to"
        >
          <img
            src={allImages[0]}
            alt="Ảnh tin nhắn"
            className="max-w-[240px] max-h-[320px] w-full object-cover hover:opacity-90 transition-opacity block"
          />
        </button>
      );
    }

    if (allImages.length === 2) {
      return (
        <div
          className="grid grid-cols-2 gap-1 overflow-hidden w-[240px] h-[160px]"
          style={{
            borderRadius: roundedTopOnly ? "0.75rem 0.75rem 0 0" : "1rem",
          }}
        >
          {allImages.slice(0, 2).map((url, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex(idx);
                setLightboxOpen(true);
              }}
              className="focus:outline-none cursor-zoom-in relative w-full h-full overflow-hidden"
              title="Xem ảnh phóng to"
            >
              <img
                src={url}
                alt={`Ảnh tin nhắn ${idx + 1}`}
                className="w-full h-full object-cover hover:opacity-90 transition-opacity"
              />
            </button>
          ))}
        </div>
      );
    }

    if (allImages.length === 3) {
      return (
        <div
          className="grid grid-cols-3 gap-1 overflow-hidden w-[240px] h-[160px]"
          style={{
            borderRadius: roundedTopOnly ? "0.75rem 0.75rem 0 0" : "1rem",
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveImageIndex(0);
              setLightboxOpen(true);
            }}
            className="col-span-2 focus:outline-none cursor-zoom-in relative w-full h-full overflow-hidden"
            title="Xem ảnh phóng to"
          >
            <img
              src={allImages[0]}
              alt="Ảnh tin nhắn 1"
              className="w-full h-full object-cover hover:opacity-90 transition-opacity"
            />
          </button>
          <div className="col-span-1 grid grid-rows-2 gap-1 h-full">
            {allImages.slice(1, 3).map((url, idx) => (
              <button
                key={idx + 1}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex(idx + 1);
                  setLightboxOpen(true);
                }}
                className="focus:outline-none cursor-zoom-in relative w-full h-full overflow-hidden"
                title="Xem ảnh phóng to"
              >
                <img
                  src={url}
                  alt={`Ảnh tin nhắn ${idx + 2}`}
                  className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                />
              </button>
            ))}
          </div>
        </div>
      );
    }

    // 4 ảnh trở lên
    const remainingCount = allImages.length - 4;
    return (
      <div
        className="grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden w-[240px] h-[180px]"
        style={{
          borderRadius: roundedTopOnly ? "0.75rem 0.75rem 0 0" : "1rem",
        }}
      >
        {allImages.slice(0, 4).map((url, idx) => {
          const isLastVisible = idx === 3;
          return (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex(idx);
                setLightboxOpen(true);
              }}
              className="focus:outline-none cursor-zoom-in relative w-full h-full overflow-hidden group/item"
              title="Xem ảnh phóng to"
            >
              <img
                src={url}
                alt={`Ảnh tin nhắn ${idx + 1}`}
                className="w-full h-full object-cover hover:opacity-90 transition-opacity"
              />
              {isLastVisible && remainingCount > 0 && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center transition-colors group-hover/item:bg-black/50">
                  <span className="text-white font-bold text-lg select-none">
                    +{remainingCount + 1}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  };

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
  const isImageOnly = allImages.length > 0 && !message.content && !message.isRecalled;

  return (
    <>
      {/* Lightbox fullscreen */}
      {lightboxOpen && allImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm select-none"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/25 rounded-full p-2.5 transition-all z-50 cursor-pointer shadow-md"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="size-5" />
          </button>

          {/* Indicator text (e.g. "2 / 5") */}
          {allImages.length > 1 && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-black/55 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full z-50 pointer-events-none tracking-wide">
              {activeImageIndex + 1} / {allImages.length}
            </div>
          )}

          {/* Left Navigation Arrow */}
          {allImages.length > 1 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-3 transition-all z-50 cursor-pointer hover:scale-105"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
              }}
            >
              <ChevronLeft className="size-6" />
            </button>
          )}

          {/* Image */}
          <img
            src={allImages[activeImageIndex]}
            alt={`Ảnh phóng to ${activeImageIndex + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Right Navigation Arrow */}
          {allImages.length > 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-3 transition-all z-50 cursor-pointer hover:scale-105"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex((prev) => (prev + 1) % allImages.length);
              }}
            >
              <ChevronRight className="size-6" />
            </button>
          )}
        </div>
      )}

      <div id={`message-${message._id}`} className={cn("flex flex-col w-full transition-all duration-300 rounded-lg p-1", isImageOnly && "mb-2")}>
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
            {/* Quoted parent message */}
            {message.replyTo && (
              <div
                onClick={() => {
                  const element = document.getElementById(`message-${message.replyTo?._id}`);
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "center" });
                    element.classList.add("bg-primary/10");
                    setTimeout(() => {
                      element.classList.remove("bg-primary/10");
                    }, 1500);
                  } else {
                    toast.error("Không tìm thấy tin nhắn gốc hoặc tin nhắn quá cũ");
                  }
                }}
                className={cn(
                  "text-[10px] px-2.5 py-1.5 bg-muted/50 text-muted-foreground rounded-xl border-l-2 border-primary/50 max-w-[200px] truncate cursor-pointer hover:bg-muted/80 transition-all select-none mb-1 shadow-sm",
                  message.isOwn ? "self-end" : "self-start"
                )}
                title="Cuộn tới tin nhắn gốc"
              >
                <span className="font-bold block text-[9px] text-primary/70 mb-0.5">
                  {message.replyTo.senderId === user?._id ? "Bạn" : (selectedConvo.participants.find(p => p._id === message.replyTo?.senderId)?.displayName || "Người dùng")} đã trả lời:
                </span>
                <span className="block truncate">
                  {message.replyTo.isRecalled
                    ? "Tin nhắn đã bị thu hồi"
                    : (message.replyTo.content ||
                       (message.replyTo.imgUrl || (message.replyTo.imgUrls && message.replyTo.imgUrls.length > 0)
                         ? "[Hình ảnh]"
                         : "[Bài viết]"))
                  }
                </span>
              </div>
            )}

            <div
              className={cn(
                "flex items-center gap-2 group/msg relative",
                message.isOwn ? "flex-row-reverse" : "flex-row",
              )}
            >
              {/* Trường hợp chỉ có ảnh — render trực tiếp không có Card */}
              {isImageOnly ? (
                renderImageGrid(false)
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
                      {allImages.length > 0 && renderImageGrid(true)}
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

                  {/* Reaction Picker Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-smooth shrink-0 cursor-pointer"
                        title="Thả cảm xúc"
                      >
                        <Smile className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align={message.isOwn ? "end" : "start"}
                      className="flex items-center gap-1.5 p-1.5 bg-popover/95 backdrop-blur-md border border-border/40 shadow-xl rounded-full"
                    >
                      {["👍", "❤️", "😂", "😮", "😢", "🙏"].map((emoji) => (
                        <DropdownMenuItem
                          key={emoji}
                          onClick={() => reactToMessage(message._id, emoji)}
                          className="p-1.5 text-base hover:scale-125 focus:scale-125 transition-transform cursor-pointer rounded-full hover:bg-primary/10 focus:bg-primary/10 flex items-center justify-center size-8"
                        >
                          {emoji}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Reply Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-smooth shrink-0 cursor-pointer"
                    onClick={() => setReplyingTo(message)}
                    title="Trả lời tin nhắn"
                  >
                    <CornerUpLeft className="size-3.5" />
                  </Button>

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

            {/* Reactions Badge */}
            {message.reactions && message.reactions.length > 0 && (
              <div
                className={cn(
                  "flex items-center gap-0.5 bg-background border border-border/40 hover:border-border/80 shadow-soft px-1.5 py-0.5 rounded-full select-none mt-1 text-[10px] w-fit cursor-pointer hover:scale-105 transition-transform duration-200",
                  message.isOwn ? "self-end mr-2" : "self-start ml-2"
                )}
                onClick={() => {
                  const myReaction = message.reactions?.find((r) => r.userId === user?._id);
                  if (myReaction) {
                    reactToMessage(message._id, myReaction.emoji);
                  }
                }}
                title={Object.entries(
                  message.reactions.reduce<Record<string, string[]>>((acc, curr) => {
                    const member = selectedConvo.participants.find((p) => p._id === curr.userId);
                    const name = curr.userId === user?._id ? "Bạn" : (member ? member.displayName : "Người dùng");
                    if (!acc[curr.emoji]) acc[curr.emoji] = [];
                    acc[curr.emoji].push(name);
                    return acc;
                  }, {})
                )
                  .map(([emoji, names]) => `${emoji} bởi: ${names.join(", ")}`)
                  .join("\n")}
              >
                <span className="flex items-center tracking-tighter">
                  {Object.keys(
                    message.reactions.reduce<Record<string, boolean>>((acc, curr) => {
                      acc[curr.emoji] = true;
                      return acc;
                    }, {})
                  ).join("")}
                </span>
                <span className="text-[9px] text-muted-foreground font-semibold ml-0.5">
                  {message.reactions.length}
                </span>
              </div>
            )}

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

            {/* Readers Who Seen This (Seen Cursors) */}
            {readersWhoSeenThis.length > 0 && (
              <div
                className={cn(
                  "flex items-center gap-1 mt-1",
                  message.isOwn ? "justify-end mr-1" : "justify-start ml-1"
                )}
              >
                {readersWhoSeenThis.map((reader) => {
                  if (!reader.userId) return null;
                  const timeStr = new Date(reader.seenAt).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const dateStr = new Date(reader.seenAt).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                  });
                  return (
                    <div
                      key={reader.userId._id}
                      title={`${reader.userId.displayName} đã xem lúc ${timeStr} ngày ${dateStr}`}
                      className="cursor-help hover:scale-110 transition-transform select-none"
                    >
                      <UserAvatar
                        type="chat"
                        name={reader.userId.displayName}
                        avatarUrl={reader.userId.avatarUrl ?? undefined}
                        className="size-4 rounded-full border border-background shadow-sm"
                      />
                    </div>
                  );
                })}
              </div>
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
