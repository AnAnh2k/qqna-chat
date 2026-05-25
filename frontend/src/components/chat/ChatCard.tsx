import { Card } from "@/components/ui/card";
import { formatOnlineTime, cn } from "@/lib/utils";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useChatStore } from "@/stores/useChatStore";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ConfirmDialog from "../common/ConfirmDialog";

interface ChatCardProps {
  convoId: string;
  name: string;
  timestamp?: Date;
  isActive: boolean;
  onSelect: (id: string) => void;
  unreadCount?: number;
  leftSection: React.ReactNode;
  subtitle: React.ReactNode;
}

const ChatCard = ({
  convoId,
  name,
  timestamp,
  isActive,
  onSelect,
  unreadCount,
  leftSection,
  subtitle,
}: ChatCardProps) => {
  const { clearConversation } = useChatStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleClear = async () => {
    try {
      setClearing(true);
      await clearConversation(convoId);
      setConfirmOpen(false);
    } finally {
      setClearing(false);
    }
  };

  return (
    <Card
      key={convoId}
      className={cn(
        "border-none p-3 cursor-pointer transition-smooth glass hover:bg-muted/30 group",
        isActive &&
          "ring-2 ring-primary/50 bg-gradient-to-tr from-primary-glow/10 to-primary-foreground",
      )}
      onClick={() => onSelect(convoId)}
    >
      <div className="flex items-center gap-3">
        <div className="relative">{leftSection}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3
              className={cn(
                "font-semibold text-sm truncate",
                unreadCount && unreadCount > 0 && "text-foreground",
              )}
            >
              {name}
            </h3>

            <span className="text-xs text-muted-foreground">
              {timestamp ? formatOnlineTime(timestamp) : ""}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 flex-1 min-w-0">
              {subtitle}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 rounded-md hover:bg-muted/50 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-smooth flex items-center justify-center focus:outline-none"
                  />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer flex items-center gap-2"
                  onClick={(event) => {
                    event.stopPropagation();
                    setConfirmOpen(true);
                  }}
                >
                  <Trash2 className="size-4" />
                  <span>Xóa trò chuyện</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Xóa trò chuyện"
        description={`Bạn có chắc chắn muốn xóa cuộc trò chuyện với "${name}"? Lịch sử tin nhắn sẽ bị xóa đối với bạn.`}
        confirmText="Xóa trò chuyện"
        variant="destructive"
        loading={clearing}
        icon={Trash2}
        onConfirm={handleClear}
      />
    </Card>
  );
};

export default ChatCard;
