import { useFriendStore } from "@/stores/useFriendStore";
import { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { UserPlus, Users } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import type { Friend } from "@/types/user";
import IniviteSuggestionList from "../newGroupChat/IniviteSuggestionList";
import SelectedUsersList from "../newGroupChat/SelectedUsersList";
import { toast } from "sonner";
import { useChatStore } from "@/stores/useChatStore";

const NewGroupChatModal = () => {
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const { friends, getFriends } = useFriendStore();
  const [invitedUsers, setInvitedUsers] = useState<Friend[]>([]);
  const { loading, createConversation } = useChatStore();

  const handleGetFriends = useCallback(async () => {
    await getFriends();
  }, [getFriends]);

  const handleSelectFriend = useCallback((friend: Friend) => {
    setInvitedUsers((prev) => [...prev, friend]);
    setSearch("");
  }, []);

  const handleRemoveFriend = useCallback((friend: Friend) => {
    setInvitedUsers((prev) => prev.filter((u) => u._id !== friend._id));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      if (invitedUsers.length === 0) {
        toast.warning("Bạn phải mời ít nhất 1 thành viên vào nhóm");
        return;
      }

      await createConversation(
        "group",
        groupName,
        invitedUsers.map((u) => u._id),
      );

      setSearch("");
      setInvitedUsers([]);
    } catch (error) {
      console.error(
        "Lỗi xảy ra khi handleSubmit trong NewGroupChatModal:",
        error,
      );
    }
  }, [groupName, invitedUsers, createConversation]);

  const filteredFriends = useMemo(() => {
    const searchLower = search.toLowerCase();
    return friends.filter(
      (friend) =>
        friend.displayName.toLowerCase().includes(searchLower) &&
        !invitedUsers.some((u) => u._id === friend._id),
    );
  }, [friends, search, invitedUsers]);

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            onClick={handleGetFriends}
            className="flex z-10 justify-center items-center size-5 rounded-full hover:bg-sidebar-accent transition cursor-pointer"
          >
            <Users className="size-4" />
            <span className="sr-only">Tạo nhóm</span>
          </Button>
        }
      />

      <DialogContent className="sm:max-w-[425px] border-none">
        <DialogHeader>
          <DialogTitle className="capitalize">tạo nhóm chat mới</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* tên nhóm */}
          <div className="space-y-2">
            <Label htmlFor="groupName" className="text-sm font-semibold">
              Tên nhóm
            </Label>
            <Input
              id="groupName"
              placeholder="Gõ tên nhóm vào đây..."
              className="glass border-border/50 focus:border-primary/50 transition-smooth"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>

          {/* mời thành viên */}
          <div className="space-y-2">
            <Label htmlFor="invite" className="text-sm font-semibold">
              Mời thành viên
            </Label>

            <Input
              id="invite"
              placeholder="Tìm theo tên hiển thị..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />

           {/* danh sách gợi ý */}
{filteredFriends.length > 0 && (
  <div className="space-y-1.5 pt-1">
    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
      Danh sách bạn bè
    </span>
    <IniviteSuggestionList
      filteredFriends={filteredFriends}
      onSelect={handleSelectFriend}
    />
  </div>
)}


            {/* danh sách user đã chọn */}
            <SelectedUsersList
              invitedUsers={invitedUsers}
              onRemove={handleRemoveFriend}
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-chat text-white hover:opacity-90 transition-smooth"
            >
              {loading ? (
                <span>Đang tạo...</span>
              ) : (
                <>
                  <UserPlus className="size-4 mr-2" />
                  Tạo nhóm
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewGroupChatModal;
