import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import UserAvatar from "./UserAvatar";
import { Badge } from "../ui/badge";
import { useUserStore } from "@/stores/useUserStore";
import type { Conversation } from "@/types/chat";
import { Card } from "../ui/card";
import { Calendar, LogOut, Shield, Trash2, Users } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { Button } from "../ui/button";
import ConfirmDialog from "../common/ConfirmDialog";
import { useState } from "react";
import { toast } from "sonner";

interface GroupMembersDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  conversation: Conversation;
}

const GroupMembersDialog = ({ open, setOpen, conversation }: GroupMembersDialogProps) => {
  const { viewProfile } = useUserStore();
  const currentUser = useAuthStore((state) => state.user);
  const { leaveGroup, disbandGroup } = useChatStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const adminId = conversation.group?.createdBy;
  const isCurrentUserAdmin = currentUser?._id === adminId;

  const handleGroupAction = async () => {
    try {
      setLoading(true);
      if (isCurrentUserAdmin) {
        await disbandGroup(conversation._id);
        toast.success("Đã giải tán nhóm.");
      } else {
        await leaveGroup(conversation._id);
        toast.success("Đã rời nhóm.");
      }
      setConfirmOpen(false);
      setOpen(false);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        (isCurrentUserAdmin ? "Không thể giải tán nhóm." : "Không thể rời nhóm.");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md overflow-hidden flex flex-col p-6 max-h-[80vh] bg-gradient-glass">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
              <Users className="size-5 text-primary" />
              <span>Thành Viên Nhóm ({conversation.participants.length})</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-2 beautiful-scrollbar pr-1 py-1">
            {conversation.participants.map((member) => {
              const isAdmin = member._id === adminId;

              return (
                <Card
                  key={member._id}
                  onClick={() => {
                    setOpen(false); // Đóng modal thành viên
                    viewProfile(member._id); // Mở profile
                  }}
                  className="p-3 flex items-center justify-between cursor-pointer transition-smooth hover:shadow-soft hover:bg-muted/30 group border-border/40"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      type="chat"
                      name={member.displayName}
                      avatarUrl={member.avatarUrl ?? undefined}
                      className="ring-2 ring-violet-100 group-hover:ring-primary/20"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-sm truncate text-slate-800 dark:text-slate-200">
                        {member.displayName}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="size-3" />
                        <span>Tham gia: {new Date(member.joinedAt).toLocaleDateString("vi-VN")}</span>
                      </span>
                    </div>
                  </div>

                  {isAdmin && (
                    <Badge
                      variant="secondary"
                      className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full select-none"
                    >
                      <Shield className="size-3 fill-amber-500/20" />
                      <span>Trưởng nhóm</span>
                    </Badge>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="mt-4 border-t border-border/40 pt-4">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setConfirmOpen(true)}
            >
              {isCurrentUserAdmin ? (
                <Trash2 className="size-4" />
              ) : (
                <LogOut className="size-4" />
              )}
              {isCurrentUserAdmin ? "Giải tán nhóm" : "Rời nhóm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={isCurrentUserAdmin ? "Giải tán nhóm" : "Rời nhóm"}
        description={
          isCurrentUserAdmin
            ? `Bạn có chắc chắn muốn giải tán nhóm "${conversation.group?.name}"? Toàn bộ thành viên sẽ mất quyền truy cập nhóm này.`
            : `Bạn có chắc chắn muốn rời nhóm "${conversation.group?.name}"?`
        }
        confirmText={isCurrentUserAdmin ? "Giải tán nhóm" : "Rời nhóm"}
        variant="destructive"
        loading={loading}
        icon={isCurrentUserAdmin ? Trash2 : LogOut}
        onConfirm={handleGroupAction}
      />
    </>
  );
};

export default GroupMembersDialog;
