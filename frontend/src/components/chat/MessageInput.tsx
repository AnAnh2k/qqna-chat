import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation, Participant } from "@/types/chat";
import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { AtSign, ImagePlus, Send, UserPlus, Users, X, Loader2, FileText } from "lucide-react";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";
import { useChatStore } from "@/stores/useChatStore";
import { useFriendStore } from "@/stores/useFriendStore";
import { toast } from "sonner";
import UserAvatar from "./UserAvatar";
import CreatePostDialog from "./CreatePostDialog";

type MentionSuggestion =
  | { type: "all"; _id: "all"; displayName: "mọi người" }
  | (Participant & { type: "member" });

const mentionAllLabel = "mọi người" as const;

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore();
  const { sendDirectMessage, sendGroupMessage, uploadMessageImage } =
    useChatStore();
  const { friends, getFriends } = useFriendStore();
  const [value, setValue] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getFriends();
  }, [getFriends]);

  const previewsRef = useRef<string[]>([]);
  useEffect(() => {
    previewsRef.current = imagePreviews;
  }, [imagePreviews]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  if (!user) return null;

  const mentionableMembers =
    selectedConvo.type === "group"
      ? selectedConvo.participants.filter((member) => member._id !== user._id)
      : [];
  const mentionLabels = [
    mentionAllLabel,
    ...mentionableMembers.map((member) => member.displayName),
  ].sort((a, b) => b.length - a.length);

  const mentionMatch = value.match(/(?:^|\s)@([^\s@]*)$/);
  const mentionQuery = mentionMatch?.[1]?.toLowerCase() ?? "";
  const showMentionSuggestions =
    selectedConvo.type === "group" && mentionMatch !== null;
  const mentionSuggestions: MentionSuggestion[] = showMentionSuggestions
    ? [
        ...(mentionAllLabel.includes(mentionQuery)
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
            member.displayName.toLowerCase().includes(mentionQuery),
          )
          .slice(0, 5)
          .map((member) => ({ ...member, type: "member" as const })),
      ]
    : [];

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

  const renderComposerValue = (content: string) => {
    if (!content || mentionLabels.length === 0) {
      return content;
    }

    const mentionPattern = new RegExp(
      `(@(?:${mentionLabels.map(escapeRegExp).join("|")}))`,
      "gi",
    );

    return content.split(mentionPattern).map((part, index) => {
      const isMention = mentionLabels.some(
        (label) => part.toLowerCase() === `@${label.toLowerCase()}`,
      );

      if (!isMention) {
        return <span key={`${part}-${index}`}>{part}</span>;
      }

      return (
        <span
          key={`${part}-${index}`}
          className="rounded-sm bg-primary/10 text-primary ring-2 ring-primary/10"
        >
          {part}
        </span>
      );
    });
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
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xảy ra khi gửi tin nhắn. Bạn hãy thử lại!");
    }
  };

  const handleSendPost = async (title: string, content: string) => {
    try {
      if (selectedConvo.type === "direct") {
        const otherUser = selectedConvo.participants.filter(
          (p) => p._id !== user._id,
        )[0];
        await sendDirectMessage(otherUser._id, content, undefined, title, "post");
      } else {
        await sendGroupMessage(
          selectedConvo._id,
          content,
          undefined,
          [],
          title,
          "post",
        );
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col bg-background border-t border-border/40">
      {/* Image Previews list */}
      {imagePreviews.length > 0 && (
        <div className="px-3 pt-3 pb-1 flex flex-wrap gap-2 max-h-32 overflow-y-auto beautiful-scrollbar">
          {imagePreviews.map((url, idx) => (
            <div key={idx} className="relative inline-block shrink-0">
              <img
                src={url}
                alt={`preview-${idx}`}
                className="h-16 w-16 rounded-xl object-cover border border-border/50 shadow-sm"
              />
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

      <div className="flex items-center gap-2 p-3 min-h-[56px]">
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
          className="hover:bg-primary/10 transition-smooth shrink-0"
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
          className="hover:bg-primary/10 transition-smooth shrink-0 text-muted-foreground hover:text-primary"
          onClick={() => setPostDialogOpen(true)}
          disabled={uploading}
          title="Soạn bài viết/câu chuyện"
        >
          <FileText className="size-4" />
        </Button>

        <div className="flex-1 relative">
          {selectedConvo.type === "group" && value && (
            <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-20 flex items-center overflow-hidden whitespace-pre px-2.5 pr-20 text-base leading-normal text-foreground md:text-sm">
              {renderComposerValue(value)}
            </div>
          )}
          <Input
            ref={inputRef}
            onKeyPress={handleKeyPress}
            onPaste={handlePaste}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Soạn tin nhắn..."
            className={`pr-20 h-9 bg-white border-border/50 focus:border-primary/50 transition-smooth resize-none ${
              selectedConvo.type === "group" && value
                ? "text-transparent caret-foreground"
                : ""
            }`}
          />
          {showMentionSuggestions && mentionSuggestions.length > 0 && (
            <div className="absolute bottom-11 left-0 z-20 w-72 overflow-hidden rounded-lg border border-border/70 bg-popover p-1 shadow-xl">
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
            </div>
          )}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            <EmojiPicker
              onChange={(emoji: string) => setValue(`${value}${emoji}`)}
            />
          </div>
        </div>

        <Button
          onClick={sendMessage}
          className="bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105 shrink-0"
          disabled={(!value.trim() && selectedImages.length === 0) || uploading}
        >
          <Send className="size-4 text-white" />
        </Button>
      </div>
      <CreatePostDialog
        open={postDialogOpen}
        setOpen={setPostDialogOpen}
        onSend={handleSendPost}
      />
    </div>
  );
};

export default MessageInput;
