const UnreadCountBadge = ({ unreadCount }: { unreadCount: number }) => {
  return (
    <div className="pulse-ring absolute z-20 -top-1 -right-1">
      <div className="flex items-center justify-center size-5 text-[10px] font-bold text-white bg-gradient-chat border-2 border-background rounded-full">
        {unreadCount > 9 ? "9+" : unreadCount}
      </div>
    </div>
  );
};

export default UnreadCountBadge;
