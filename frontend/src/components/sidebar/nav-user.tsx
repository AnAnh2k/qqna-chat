import { Bell, ChevronsUpDown, LogOut, UserIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { User } from "@/types/user";
import { useState } from "react";
import FriendRequestDialog from "../friendRequest/FriendRequestDialog";
import { useUserStore } from "@/stores/useUserStore";
import ConfirmDialog from "../common/ConfirmDialog";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router";

export function NavUser({ user }: { user: User }) {
  const { isMobile } = useSidebar();
  const [friendRequestOpen, setfriendRequestOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const { viewProfile } = useUserStore();
  const { signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await signOut();
      setLogoutConfirmOpen(false);
      navigate("/signin");
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="aria-expanded:bg-muted"
                />
              }
            >
              <Avatar>
                <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.displayName}</span>
                <span className="truncate text-xs">{user.username}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar>
                    <AvatarImage src={user.avatarUrl} alt={user.username} />
                    <AvatarFallback>
                      {user.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {user.displayName}
                    </span>
                    <span className="truncate text-xs">{user.username}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => viewProfile(user._id)}>
                  <UserIcon className="text-muted-foreground dark:group-focus:!text-accent-foreground" />
                  Tài Khoản
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setfriendRequestOpen(true)}>
                  <Bell className="text-muted-foreground dark:group-focus:!text-accent-foreground" />
                  Thông Báo
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                variant="destructive"
                onClick={() => setLogoutConfirmOpen(true)}
              >
                <LogOut className="text-destructive" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <FriendRequestDialog
        open={friendRequestOpen}
        setOpen={setfriendRequestOpen}
      />

      <ConfirmDialog
        open={logoutConfirmOpen}
        onOpenChange={setLogoutConfirmOpen}
        title="Xác nhận đăng xuất"
        description="Bạn có chắc chắn muốn đăng xuất khỏi tài khoản hiện tại không?"
        confirmText="Đăng xuất"
        variant="destructive"
        loading={logoutLoading}
        icon={LogOut}
        onConfirm={handleLogout}
      />
    </>
  );
}
