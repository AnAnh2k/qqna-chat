import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation, Participant } from "@/types/chat";
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "../ui/button";
import { AtSign, ImagePlus, Send, UserPlus, Users, X, Loader2, FileText } from "lucide-react";
import { Textarea } from "../ui/textarea";
import EmojiPicker from "./EmojiPicker";
import { useChatStore } from "@/stores/useChatStore";
import { useFriendStore } from "@/stores/useFriendStore";
import { toast } from "sonner";
import UserAvatar from "./UserAvatar";
import CreatePostDialog from "./CreatePostDialog";
import AvatarPreviewDialog from "../common/AvatarPreviewDialog";
import { getReplyPreviewText } from "@/lib/messagePreview";

type MentionSuggestion =
  | { type: "all"; _id: "all"; displayName: "mọi người" }
  | (Participant & { type: "member" });

const mentionAllLabel = "mọi người" as const;
const COMPOSER_MAX_HEIGHT = 144;
const MENTION_DROPDOWN_WIDTH = 288;
const MENTION_DROPDOWN_MAX_HEIGHT = 260;
const MENTION_DROPDOWN_GAP = 8;
const MENTION_DROPDOWN_VIEWPORT_PADDING = 12;

const normalizeMentionText = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

type MentionDropdownPosition = {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
};

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore();
  const {
    conversations,
    sendDirectMessage,
    sendGroupMessage,
    uploadMessageImage,
    replyingTo,
    setReplyingTo,
  } =
    useChatStore();
  const { friends, getFriends } = useFriendStore();
  const [value, setValue] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [composerExpanded, setComposerExpanded] = useState(false);
  const [mentionDropdownPosition, setMentionDropdownPosition] =
    useState<MentionDropdownPosition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getFriends();
  }, [getFriends]);

  useEffect(() => {
    if (!replyingTo) return;

    requestAnimationFrame(() => inputRef.current?.focus());
  }, [replyingTo]);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    input.style.height = "auto";
    const nextHeight = Math.min(input.scrollHeight, COMPOSER_MAX_HEIGHT);
    input.style.height = `${nextHeight}px`;
    setComposerExpanded(nextHeight > 40);
    input.style.overflowY =
      input.scrollHeight > COMPOSER_MAX_HEIGHT ? "auto" : "hidden";
  }, [value]);

  const previewsRef = useRef<string[]>([]);
  useEffect(() => {
    previewsRef.current = imagePreviews;
  }, [imagePreviews]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const currentConvo =
    conversations.find((conversation) => conversation._id === selectedConvo._id) ??
    selectedConvo;
  const mentionableMembers =
    currentConvo.type === "group" && user
      ? currentConvo.participants.filter((member) => member._id !== user._id)
      : [];
  const mentionMatch = value.match(/(?:^|\s)@([^\s@]*)$/);
  const mentionQuery = normalizeMentionText(mentionMatch?.[1] ?? "");
  const showMentionSuggestions =
    currentConvo.type === "group" && mentionMatch !== null;
  const mentionSuggestions: MentionSuggestion[] = showMentionSuggestions
    ? [
        ...(normalizeMentionText(mentionAllLabel).includes(mentionQuery)
          ? [
              {
                type: "all" as const,
                _id: "all" as const,
                displayName: mentionAllLabel,
              },
            ]
          : []),
        ...mentionableMembers
          .filter((member) =>
            normalizeMentionText(member.displayName).includes(mentionQuery),
          )
          .sort((a, b) => a.displayName.localeCompare(b.displayName, "vi"))
          .map((member) => ({ ...member, type: "member" as const })),
      ]
    : [];
  const hasMentionSuggestions =
    showMentionSuggestions && mentionSuggestions.length > 0;

  const updateMentionDropdownPosition = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;

    const rect = input.getBoundingClientRect();
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const viewportOffsetLeft = window.visualViewport?.offsetLeft ?? 0;
    const viewportOffsetTop = window.visualViewport?.offsetTop ?? 0;
    const viewportLeft = viewportOffsetLeft + MENTION_DROPDOWN_VIEWPORT_PADDING;
    const viewportRight =
      viewportOffsetLeft + viewportWidth - MENTION_DROPDOWN_VIEWPORT_PADDING;
    const viewportTop = viewportOffsetTop + MENTION_DROPDOWN_VIEWPORT_PADDING;
    const viewportBottom =
      viewportOffsetTop + viewportHeight - MENTION_DROPDOWN_VIEWPORT_PADDING;
    const width = Math.min(
      MENTION_DROPDOWN_WIDTH,
      Math.max(0, viewportRight - viewportLeft),
    );
    const preferredLeft = Math.min(
      Math.max(rect.left, viewportLeft),
      viewportRight - width,
    );
    const spaceAbove = rect.top - viewportTop - MENTION_DROPDOWN_GAP;
    const spaceBelow = viewportBottom - rect.bottom - MENTION_DROPDOWN_GAP;
    const openAbove = spaceAbove >= 120 || spaceAbove >= spaceBelow;
    const maxHeight = Math.max(
      96,
      Math.min(
        MENTION_DROPDOWN_MAX_HEIGHT,
        Math.max(openAbove ? spaceAbove : spaceBelow, 96),
      ),
    );

    setMentionDropdownPosition(
      openAbove
        ? {
            left: preferredLeft,
            width,
            maxHeight,
            bottom: viewportHeight - rect.top + MENTION_DROPDOWN_GAP,
          }
        : {
            left: preferredLeft,
            width,
            maxHeight,
            top: rect.bottom + MENTION_DROPDOWN_GAP,
          },
    );
  }, []);

  useLayoutEffect(() => {
    if (!hasMentionSuggestions) {
      setMentionDropdownPosition(null);
      return;
    }

    updateMentionDropdownPosition();
  }, [
    hasMentionSuggestions,
    value,
    replyingTo,
    imagePreviews.length,
    composerExpanded,
    updateMentionDropdownPosition,
  ]);

  useEffect(() => {
    if (!hasMentionSuggestions) return;

    const handlePositionChange = () => updateMentionDropdownPosition();
    const visualViewport = window.visualViewport;

    window.addEventListener("resize", handlePositionChange);
    window.addEventListener("scroll", handlePositionChange, true);
    visualViewport?.addEventListener("resize", handlePositionChange);
    visualViewport?.addEventListener("scroll", handlePositionChange);

    return () => {
      window.removeEventListener("resize", handlePositionChange);
      window.removeEventListener("scroll", handlePositionChange, true);
      visualViewport?.removeEventListener("resize", handlePositionChange);
      visualViewport?.removeEventListener("scroll", handlePositionChange);
    };
  }, [hasMentionSuggestions, updateMentionDropdownPosition]);

  if (!user) return null;

  const getMentionedUserIds = (content: string) => {
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes(`@${mentionAllLabel}`)) {
      return mentionableMembers.map((member) => member._id);
    }

    return mentionableMembers
      .filter((member) =>
        lowerContent.includes(`@${member.displayName.toLowerCase()}`),
      )
      .map((member) => member._id);
  };

  const insertMention = (mention: MentionSuggestion) => {
    setValue((current) =>
      current.replace(/(^|\s)@([^\s@]*)$/, `$1@${mention.displayName} `),
    );
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  // Kiểm tra quan hệ bạn bè đối với hội thoại tin nhắn riêng (1v1)
  if (selectedConvo.type === "direct") {
    const otherUser = selectedConvo.participants.find((p) => p._id !== user._id);
    const isFriend = friends.some((f) => f._id === otherUser?._id);

    if (!isFriend) {
      return (
        <div className="flex flex-col items-center justify-center p-4 bg-muted/30 border-t border-border/40 text-center gap-2">
          <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5 justify-center">
            <UserPlus className="size-4 text-amber-500" />
            <span>Hai bạn hiện không phải là bạn bè. Hãy gửi lại lời mời kết bạn để tiếp tục trò chuyện.</span>
          </p>
        </div>
      );
    }
  }

  const clearImages = () => {
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setSelectedImages([]);
    setImagePreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    URL.revokeObjectURL(imagePreviews[idx]);
    setSelectedImages((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddFiles = (files: File[]) => {
    const validImageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (validImageFiles.length === 0) return;

    const urls = validImageFiles.map((f) => URL.createObjectURL(f));
    setSelectedImages((prev) => [...prev, ...validImageFiles]);
    setImagePreviews((prev) => [...prev, ...urls]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    handleAddFiles(files);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      handleAddFiles(files);
    }
  };

  const sendMessage = async () => {
    if (!value.trim() && selectedImages.length === 0) return;
    const currValue = value;
    setValue("");
    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      input.style.height = "auto";
      input.style.overflowY = "hidden";
      setComposerExpanded(false);
    });

    try {
      let imgUrls: string[] = [];

      if (selectedImages.length > 0) {
        setUploading(true);
        try {
          imgUrls = await Promise.all(
            selectedImages.map((file) => uploadMessageImage(file)),
          );
        } catch (uploadError) {
          console.error("Upload error", uploadError);
          toast.error("Một số hình ảnh tải lên thất bại. Vui lòng thử lại!");
          return;
        } finally {
          setUploading(false);
          clearImages();
        }
      }

      const singleImgUrl = imgUrls.length === 1 ? imgUrls[0] : undefined;
      const albumImgUrls = imgUrls.length > 1 ? imgUrls : undefined;

      if (selectedConvo.type === "direct") {
        const otherUser = selectedConvo.participants.filter(
          (p) => p._id !== user._id,
        )[0];
        await sendDirectMessage(
          otherUser._id,
          currValue,
          singleImgUrl,
          undefined,
          undefined,
          albumImgUrls,
          replyingTo?._id,
        );
      } else {
        await sendGroupMessage(
          selectedConvo._id,
          currValue,
          singleImgUrl,
          getMentionedUserIds(currValue),
          undefined,
          undefined,
          albumImgUrls,
          replyingTo?._id,
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xảy ra khi gửi tin nhắn. Bạn hãy thử lại!");
    }
  };

  const handleSendPost = async (
    title: string,
    content: string,
    imageUrls: string[] = [],
  ) => {
    try {
      const singleImgUrl = imageUrls.length === 1 ? imageUrls[0] : undefined;
      const albumImgUrls = imageUrls.length > 1 ? imageUrls : undefined;

      if (selectedConvo.type === "direct") {
        const otherUser = selectedConvo.participants.filter(
          (p) => p._id !== user._id,
        )[0];
        await sendDirectMessage(
          otherUser._id,
          content,
          singleImgUrl,
          title,
          "post",
          albumImgUrls,
        );
      } else {
        await sendGroupMessage(
          selectedConvo._id,
          content,
          singleImgUrl,
          [],
          title,
          "post",
          albumImgUrls,
        );
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const insertEmoji = (emoji: string) => {
    const input = inputRef.current;
    if (!input) {
      setValue((current) => `${current}${emoji}`);
      return;
    }

    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    const nextValue = `${value.slice(0, start)}${emoji}${value.slice(end)}`;
    setValue(nextValue);

    requestAnimationFrame(() => {
      input.focus();
      const nextCursor = start + emoji.length;
      input.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const replySender = selectedConvo.participants.find(p => p._id === replyingTo?.senderId);
  const replySenderName = replyingTo?.isOwn ? "chính bản thân" : (replySender ? replySender.displayName : "Người dùng");

  return (
    <div className="flex min-w-0 flex-col overflow-x-hidden bg-background border-t border-border/40">
      {/* Replying Preview Bar */}
      {replyingTo && (
        <div className="px-4 py-2 flex items-center justify-between bg-primary/5 border-b border-border/30 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[11px] font-bold text-primary flex items-center gap-1 select-none">
              <span className="inline-block border-l-2 border-primary h-2.5 mr-0.5" />
              Đang trả lời {replySenderName}
            </span>
            <span className="line-clamp-2 break-words text-xs text-muted-foreground pr-4">
              {getReplyPreviewText(replyingTo)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full p-1 transition-smooth cursor-pointer shrink-0"
            title="Hủy trả lời"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Image Previews list */}
      {imagePreviews.length > 0 && (
        <div className="px-3 pt-3 pb-1 flex flex-wrap gap-2 max-h-32 overflow-y-auto beautiful-scrollbar">
          {imagePreviews.map((url, idx) => (
            <div key={idx} className="relative inline-block shrink-0">
              <button
                type="button"
                onClick={() => setPreviewImageUrl(url)}
                className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                title="Xem ảnh trước khi gửi"
              >
                <img
                  src={url}
                  alt={`preview-${idx}`}
                  className="h-16 w-16 rounded-xl object-cover border border-border/50 shadow-sm transition-opacity hover:opacity-90"
                />
              </button>
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-4.5 h-4.5 flex items-center justify-center shadow hover:scale-110 transition-transform cursor-pointer"
              >
                <X className="size-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex w-full max-w-full min-w-0 items-end gap-2 overflow-x-hidden p-3 min-h-[56px]">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        <Button
          variant="ghost"
          size="icon"
          className="mb-0.5 hover:bg-primary/10 transition-smooth shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Gửi ảnh"
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin text-primary" />
          ) : (
            <ImagePlus className="size-4" />
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mb-0.5 hover:bg-primary/10 transition-smooth shrink-0 text-muted-foreground hover:text-primary"
          onClick={() => setPostDialogOpen(true)}
          disabled={uploading}
          title="Soạn bài viết/câu chuyện"
        >
          <FileText className="size-4" />
        </Button>

        <div className="relative flex min-w-0 max-w-full flex-1 items-center">
          <Textarea
            ref={inputRef}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Soạn tin nhắn..."
            rows={1}
            className="box-border block w-full max-w-full min-w-0 min-h-9 max-h-36 resize-none overflow-x-hidden overflow-y-hidden whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word] [line-break:anywhere] bg-white py-2 pl-2.5 pr-20 text-sm leading-5 border-border/50 focus:border-primary/50 transition-smooth beautiful-scrollbar"
          />
          {hasMentionSuggestions &&
            mentionDropdownPosition &&
            createPortal(
              <div
                className="fixed z-[9999] overflow-y-auto overflow-x-hidden rounded-lg border border-border/70 bg-popover p-1 shadow-2xl ring-1 ring-foreground/10 beautiful-scrollbar"
                style={{
                  left: mentionDropdownPosition.left,
                  width: mentionDropdownPosition.width,
                  maxHeight: mentionDropdownPosition.maxHeight,
                  top: mentionDropdownPosition.top,
                  bottom: mentionDropdownPosition.bottom,
                }}
              >
              {mentionSuggestions.map((mention) => (
                <button
                  key={mention._id}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    insertMention(mention);
                  }}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-primary/10 focus:bg-primary/10 focus:outline-none"
                >
                  {mention.type === "all" ? (
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Users className="size-4" />
                    </span>
                  ) : (
                    <UserAvatar
                      type="chat"
                      name={mention.displayName}
                      avatarUrl={mention.avatarUrl ?? undefined}
                      className="size-8"
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-foreground">
                      @{mention.displayName}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {mention.type === "all"
                        ? "Nhắc tất cả thành viên trong nhóm"
                        : "Nhắc thành viên này"}
                    </span>
                  </span>
                  <AtSign className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
              </div>,
              document.body,
            )}
          <div
            className={`absolute right-2 flex size-8 items-center justify-center ${
              composerExpanded
                ? "bottom-1.5"
                : "top-1/2 -translate-y-1/2"
            }`}
          >
            <EmojiPicker
              onChange={insertEmoji}
            />
          </div>
        </div>

        <Button
          onClick={sendMessage}
          className="mb-0.5 bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105 shrink-0"
          disabled={(!value.trim() && selectedImages.length === 0) || uploading}
        >
          <Send className="size-4 text-white" />
        </Button>
      </div>
      <CreatePostDialog
        open={postDialogOpen}
        setOpen={setPostDialogOpen}
        onSend={handleSendPost}
        onUploadImage={uploadMessageImage}
      />
      <AvatarPreviewDialog
        open={!!previewImageUrl}
        onOpenChange={(open) => {
          if (!open) setPreviewImageUrl(null);
        }}
        imageUrl={previewImageUrl}
        name="ảnh xem trước"
      />
    </div>
  );
};

export default MessageInput;
