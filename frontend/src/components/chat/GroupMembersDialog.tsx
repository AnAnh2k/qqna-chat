import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import UserAvatar from "./UserAvatar";
import GroupChatAvatar from "./GroupChatAvatar";
import { Badge } from "../ui/badge";
import { useUserStore } from "@/stores/useUserStore";
import type { Conversation } from "@/types/chat";
import { Card } from "../ui/card";
import { Calendar, LogOut, Shield, Trash2, UserPlus, Users, Pencil, Check, X, Camera } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { Button } from "../ui/button";
import ConfirmDialog from "../common/ConfirmDialog";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useFriendStore } from "@/stores/useFriendStore";
import type { Friend } from "@/types/user";
import IniviteSuggestionList from "../newGroupChat/IniviteSuggestionList";
import SelectedUsersList from "../newGroupChat/SelectedUsersList";
import AvatarPreviewDialog from "../common/AvatarPreviewDialog";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return fallback;
  }

  const response = error.response as {
    data?: { message?: unknown };
  };

  return typeof response.data?.message === "string"
    ? response.data.message
    : fallback;
};

interface GroupMembersDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  conversation: Conversation;
}

const GroupMembersDialog = ({ open, setOpen, conversation }: GroupMembersDialogProps) => {
  const { viewProfile } = useUserStore();
  const currentUser = useAuthStore((state) => state.user);
  const {
    leaveGroup,
    disbandGroup,
    addGroupMembers,
    renameGroup,
    uploadGroupAvatar,
  } = useChatStore();
  const { friends, getFriends } = useFriendStore();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingMembers, setAddingMembers] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState(conversation.group?.name || "");
  const [renaming, setRenaming] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
  const adminId = conversation.group?.createdBy;
  const isCurrentUserAdmin = currentUser?._id === adminId;

  useEffect(() => {
    if (open) {
      getFriends();
    }
  }, [getFriends, open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setAddMembersOpen(false);
      setMemberSearch("");
      setSelectedMembers([]);
      setIsEditingName(false);
      setNewGroupName(conversation.group?.name || "");
    }
    setOpen(nextOpen);
  };

  const filteredFriends = useMemo(() => {
    const existingMemberIds = new Set(
      conversation.participants.map((member) => member._id),
    );
    const selectedMemberIds = new Set(
      selectedMembers.map((member) => member._id),
    );
    const search = memberSearch.trim().toLowerCase();

    return friends.filter((friend) => {
      const matchesSearch =
        !search || friend.displayName.toLowerCase().includes(search);

      return (
        matchesSearch &&
        !existingMemberIds.has(friend._id) &&
        !selectedMemberIds.has(friend._id)
      );
    });
  }, [conversation.participants, friends, memberSearch, selectedMembers]);

  const handleSelectFriend = (friend: Friend) => {
    setSelectedMembers((current) => [...current, friend]);
    setMemberSearch("");
  };

  const handleRemoveSelectedFriend = (friend: Friend) => {
    setSelectedMembers((current) =>
      current.filter((member) => member._id !== friend._id),
    );
  };

  const handleAddMembers = async () => {
    if (selectedMembers.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một thành viên.");
      return;
    }

    try {
      setAddingMembers(true);
      await addGroupMembers(
        conversation._id,
        selectedMembers.map((member) => member._id),
      );
      setSelectedMembers([]);
      setMemberSearch("");
      setAddMembersOpen(false);
      toast.success("Đã thêm thành viên vào nhóm.");
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error, "Không thể thêm thành viên vào nhóm."),
      );
    } finally {
      setAddingMembers(false);
    }
  };

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
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(
          error,
          isCurrentUserAdmin ? "Không thể giải tán nhóm." : "Không thể rời nhóm.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRenameGroup = async () => {
    const trimmed = newGroupName.trim();
    if (!trimmed) {
      toast.warning("Tên nhóm không được để trống.");
      return;
    }
    if (trimmed === conversation.group?.name) {
      setIsEditingName(false);
      return;
    }

    try {
      setRenaming(true);
      await renameGroup(conversation._id, trimmed);
      setIsEditingName(false);
      toast.success("Đã đổi tên nhóm thành công.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Không thể đổi tên nhóm."));
    } finally {
      setRenaming(false);
    }
  };

  const handleGroupAvatarChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.warning("Vui lòng chọn file ảnh.");
      return;
    }

    try {
      setUploadingAvatar(true);
      await uploadGroupAvatar(conversation._id, file);
      toast.success("Đã cập nhật avatar nhóm.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Không thể cập nhật avatar nhóm."));
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="w-[min(92vw,820px)] overflow-hidden flex flex-col p-6 max-h-[92vh] bg-gradient-glass">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
              <Users className="size-5 text-primary" />
              <span>Thành Viên Nhóm ({conversation.participants.length})</span>
            </DialogTitle>
          </DialogHeader>

          <div className="mb-4 flex items-center gap-3 rounded-xl border border-border/40 bg-muted/20 p-3.5 shadow-sm">
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() =>
                  conversation.group?.avatarUrl && setAvatarPreviewOpen(true)
                }
                className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                title={conversation.group?.avatarUrl ? "Xem avatar nhóm" : undefined}
              >
                <GroupChatAvatar
                  participants={conversation.participants}
                  type="sidebar"
                  name={conversation.group?.name}
                  avatarUrl={conversation.group?.avatarUrl}
                />
              </button>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-2 ring-background transition-smooth hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-70"
                title="Đổi avatar nhóm"
              >
                <Camera className="size-3.5" />
              </button>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleGroupAvatarChange}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Avatar nhóm
              </p>
              <p className="text-xs text-muted-foreground">
                {uploadingAvatar
                  ? "Đang tải ảnh lên..."
                  : "Bấm avatar để xem lớn, bấm camera để đổi ảnh."}
              </p>
            </div>
          </div>

          {/* Sửa tên nhóm */}
          <div className="mb-4 p-3.5 rounded-xl border border-border/40 bg-muted/20 flex flex-col gap-1.5 shadow-sm">
            <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Tên nhóm</Label>
            {isEditingName ? (
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={newGroupName}
                  onChange={(event) => setNewGroupName(event.target.value)}
                  className="h-9 glass-light border-border/30 text-sm"
                  placeholder="Nhập tên nhóm mới..."
                  maxLength={50}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameGroup();
                    if (e.key === "Escape") {
                      setIsEditingName(false);
                      setNewGroupName(conversation.group?.name || "");
                    }
                  }}
                />
                <Button 
                  size="sm" 
                  className="h-9 px-3"
                  onClick={handleRenameGroup} 
                  disabled={renaming || !newGroupName.trim() || newGroupName.trim() === conversation.group?.name}
                >
                  {renaming ? "Lưu..." : <Check className="size-4" />}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-9 px-3 text-muted-foreground"
                  onClick={() => { 
                    setIsEditingName(false); 
                    setNewGroupName(conversation.group?.name || ""); 
                  }}
                  disabled={renaming}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 mt-0.5">
                <span className="font-bold text-base text-foreground break-all leading-snug">
                  {conversation.group?.name}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 rounded-lg hover:bg-muted shrink-0"
                  onClick={() => {
                    setNewGroupName(conversation.group?.name || "");
                    setIsEditingName(true);
                  }}
                  title="Đổi tên nhóm"
                >
                  <Pencil className="size-4 text-muted-foreground hover:text-primary transition-colors" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 beautiful-scrollbar pr-1 py-1">
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

          <div className="mt-4 space-y-4 border-t border-border/40 pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setAddMembersOpen((current) => !current)}
            >
              <UserPlus className="size-4" />
              Thêm thành viên
            </Button>

            {addMembersOpen && (
              <div className="space-y-3 rounded-xl border border-border/40 bg-background/40 p-3">
                <div className="space-y-2">
                  <Label htmlFor="add-group-member">Chọn bạn bè</Label>
                  <Input
                    id="add-group-member"
                    placeholder="Tìm theo tên hiển thị..."
                    value={memberSearch}
                    onChange={(event) => setMemberSearch(event.target.value)}
                    className="glass-light border-border/30"
                  />
                </div>

                {filteredFriends.length > 0 ? (
                  <IniviteSuggestionList
                    filteredFriends={filteredFriends}
                    onSelect={handleSelectFriend}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Không có bạn bè phù hợp để thêm vào nhóm.
                  </p>
                )}

                <SelectedUsersList
                  invitedUsers={selectedMembers}
                  onRemove={handleRemoveSelectedFriend}
                />

                <Button
                  className="w-full"
                  onClick={handleAddMembers}
                  disabled={addingMembers || selectedMembers.length === 0}
                >
                  <UserPlus className="size-4" />
                  {addingMembers ? "Đang thêm..." : "Thêm vào nhóm"}
                </Button>
              </div>
            )}

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
      <AvatarPreviewDialog
        open={avatarPreviewOpen}
        onOpenChange={setAvatarPreviewOpen}
        imageUrl={conversation.group?.avatarUrl}
        name={conversation.group?.name || "nhóm"}
      />
    </>
  );
};

export default GroupMembersDialog;
