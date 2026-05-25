import type { User } from "@/types/user";
import { Card, CardContent } from "../ui/card";
import UserAvatar from "../chat/UserAvatar";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { useSocketStore } from "@/stores/useSocketStore";
import AvatarUploader from "./AvatarUploader";

import { useAuthStore } from "@/stores/useAuthStore";

interface ProfileCardProps {
  user: User | null;
}

const ProfileCard = ({ user }: ProfileCardProps) => {
  const { onlineUsers } = useSocketStore();
  const { user: currentUser } = useAuthStore();
  if (!user) return;

  if (!user.bio) {
    user.bio = "Will code for food 💻";
  }

  const isOnline = onlineUsers.includes(user._id) ? true : false;
  const isOwnProfile = currentUser?._id === user._id;

  return (
    <Card className="overflow-hidden p-0 h-52 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
      <CardContent className="relative h-full flex flex-col sm:flex-row items-center gap-6 p-6 bg-transparent">
        <div className="relative">
          <UserAvatar
            type="profile"
            name={user.displayName}
            avatarUrl={user.avatarUrl ?? undefined}
            className="ring-4 ring-white shadow-lg"
          />

          {/* todo upload avatar */}
          {isOwnProfile && <AvatarUploader />}
        </div>

        {/* user info */}
        <div className="text-center sm:text-left flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {user.displayName}
          </h1>

          {user.bio && (
            <p className="text-white/80 text-sm mt-1 max-w-lg line-clamp-2">
              {user.bio}
            </p>
          )}
        </div>

        {/* status */}
        <Badge
          className={cn(
            "absolute bottom-6 right-6 flex items-center gap-1.5 capitalize px-3 py-1 text-xs font-semibold rounded-full",
            isOnline
              ? "bg-green-100 text-green-700 hover:bg-green-100"
              : "bg-slate-100 text-slate-700 hover:bg-slate-100",
          )}
        >
          <div
            className={cn(
              "size-2 rounded-full",
              isOnline ? "bg-green-500 animate-pulse" : "bg-slate-500",
            )}
          />

          {isOnline ? "online" : "offline"}
        </Badge>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
