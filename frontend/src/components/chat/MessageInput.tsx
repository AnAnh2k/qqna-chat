import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { ImagePlus, Send, UserPlus } from "lucide-react";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";
import { useChatStore } from "@/stores/useChatStore";
import { useFriendStore } from "@/stores/useFriendStore";
import { toast } from "sonner";

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore();
  const { sendDirectMessage, sendGroupMessage } = useChatStore();
  const { friends, getFriends } = useFriendStore();
  const [value, setValue] = useState("");

  useEffect(() => {
    getFriends();
  }, [getFriends]);

  if (!user) return null;

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

  const sendMessage = async () => {
    if (!value.trim()) return;
    const currValue = value;
    setValue("");

    try {
      if (selectedConvo.type === "direct") {
        const participants = selectedConvo.participants;
        const otherUser = participants.filter((p) => p._id !== user._id)[0];
        await sendDirectMessage(otherUser._id, currValue);
      } else {
        await sendGroupMessage(selectedConvo._id, currValue);
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
    <div className="flex items-center gap-2 p-3 min-h-[56px] bg-background">
      <Button
        variant="ghost"
        size="icon"
        className="hover:bg-primary/10 transition-smooth"
      >
        <ImagePlus className="size-4" />
      </Button>

      <div className="flex-1 relative">
        <Input
          onKeyPress={handleKeyPress}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Soạn tin nhắn..."
          className="pr-20 h-9 bg-white border-border/50 focus:border-primary/50 transition-smooth resize-none"
        ></Input>
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <EmojiPicker
            onChange={(emoji: string) => setValue(`${value}${emoji}`)}
          />
        </div>
      </div>

      <Button
        onClick={sendMessage}
        className="bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105"
        disabled={!value.trim()}
      >
        <Send className="size-4 text-white" />
      </Button>
    </div>
  );
};

export default MessageInput;
