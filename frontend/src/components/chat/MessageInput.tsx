import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation, Participant } from "@/types/chat";
import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { ImagePlus, Send, UserPlus, X, Loader2 } from "lucide-react";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";
import { useChatStore } from "@/stores/useChatStore";
import { useFriendStore } from "@/stores/useFriendStore";
import { toast } from "sonner";

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore();
  const { sendDirectMessage, sendGroupMessage, uploadMessageImage } =
    useChatStore();
  const { friends, getFriends } = useFriendStore();
  const [value, setValue] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imagePreviewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    getFriends();
  }, [getFriends]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrlRef.current) {
        URL.revokeObjectURL(imagePreviewUrlRef.current);
      }
    };
  }, []);

  if (!user) return null;

  const mentionableMembers =
    selectedConvo.type === "group"
      ? selectedConvo.participants.filter((member) => member._id !== user._id)
      : [];

  const mentionMatch = value.match(/(?:^|\s)@([^\s@]*)$/);
  const mentionQuery = mentionMatch?.[1]?.toLowerCase() ?? "";
  const showMentionSuggestions =
    selectedConvo.type === "group" && mentionMatch !== null;
  const mentionSuggestions = showMentionSuggestions
    ? mentionableMembers
        .filter((member) =>
          member.displayName.toLowerCase().includes(mentionQuery),
        )
        .slice(0, 5)
    : [];

  const getMentionedUserIds = (content: string) => {
    const lowerContent = content.toLowerCase();

    return mentionableMembers
      .filter((member) =>
        lowerContent.includes(`@${member.displayName.toLowerCase()}`),
      )
      .map((member) => member._id);
  };

  const insertMention = (member: Participant) => {
    setValue((current) =>
      current.replace(/(^|\s)@([^\s@]*)$/, `$1@${member.displayName} `),
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

  const clearImage = () => {
    if (imagePreviewUrlRef.current) {
      URL.revokeObjectURL(imagePreviewUrlRef.current);
      imagePreviewUrlRef.current = null;
    }
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const setImageWithPreview = (file: File) => {
    if (imagePreviewUrlRef.current) {
      URL.revokeObjectURL(imagePreviewUrlRef.current);
    }

    const url = URL.createObjectURL(file);
    imagePreviewUrlRef.current = url;
    setSelectedImage(file);
    setImagePreview(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ chấp nhận file ảnh!");
      return;
    }
    setImageWithPreview(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) setImageWithPreview(file);
        break;
      }
    }
  };

  const sendMessage = async () => {
    if (!value.trim() && !selectedImage) return;
    const currValue = value;
    setValue("");

    try {
      let imgUrl: string | undefined;

      if (selectedImage) {
        setUploading(true);
        try {
          imgUrl = await uploadMessageImage(selectedImage);
        } finally {
          setUploading(false);
          clearImage();
        }
      }

      if (selectedConvo.type === "direct") {
        const otherUser = selectedConvo.participants.filter(
          (p) => p._id !== user._id,
        )[0];
        await sendDirectMessage(otherUser._id, currValue, imgUrl);
      } else {
        await sendGroupMessage(
          selectedConvo._id,
          currValue,
          imgUrl,
          getMentionedUserIds(currValue),
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xảy ra khi gửi tin nhắn. Bạn hãy thử lại!");
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
      {/* Image Preview */}
      {imagePreview && (
        <div className="px-3 pt-3 pb-1">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="preview"
              className="max-h-32 max-w-[200px] rounded-xl object-cover border border-border/50 shadow-sm"
            />
            <button
              onClick={clearImage}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center shadow hover:scale-110 transition-transform"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 p-3 min-h-[56px]">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
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

        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            onKeyPress={handleKeyPress}
            onPaste={handlePaste}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Soạn tin nhắn..."
            className="pr-20 h-9 bg-white border-border/50 focus:border-primary/50 transition-smooth resize-none"
          />
          {mentionSuggestions.length > 0 && (
            <div className="absolute bottom-11 left-0 z-20 w-64 overflow-hidden rounded-md border border-border bg-popover shadow-md">
              {mentionSuggestions.map((member) => (
                <button
                  key={member._id}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    insertMention(member);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <span className="font-medium">{member.displayName}</span>
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
          disabled={(!value.trim() && !selectedImage) || uploading}
        >
          <Send className="size-4 text-white" />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
