import type { FriendRequest } from "@/types/user";
import type { ReactNode } from "react";
import UserAvatar from "../chat/UserAvatar";

interface RequestItemProps {
  requestInfo: FriendRequest;
  actions: ReactNode;
  type: "sent" | "received";
}

const FriendRequestItem = ({
  requestInfo,
  actions,
  type,
}: RequestItemProps) => {
  if (!requestInfo) {
    return;
  }
  const info = type === "sent" ? requestInfo.to : requestInfo.from;

  if (!info) {
    return;
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg shadow-md border border-primary-foreground p-4 bg-white/50 dark:bg-slate-900/40">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <UserAvatar type="sidebar" name={info.displayName} avatarUrl={info.avatarUrl} />
          <div>
            <p className="font-medium">{info.displayName}</p>
            <p className="text-sm text-muted-foreground">@{info.username}</p>
          </div>
        </div>
        {actions}
      </div>
      {requestInfo.message && (
        <div className="mt-1 text-sm bg-muted/50 dark:bg-slate-800/50 p-2.5 rounded border border-border/40 text-slate-700 dark:text-slate-350">
          <span className="font-semibold text-slate-500 dark:text-slate-400 block text-xs mb-0.5">Lời nhắn:</span>
          "{requestInfo.message}"
        </div>
      )}
    </div>
  );
};

export default FriendRequestItem;
