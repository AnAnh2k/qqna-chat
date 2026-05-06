import Logout from "@/components/auth/logout";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@base-ui/react/button";
import { toast } from "sonner";

const ChatAppPage = () => {
  const user = useAuthStore((s) => s.user);

  const handletest = async () => {
    try {
      await fetch("/api/test");
      toast.success("ok!");
    } catch {
      toast.error("Có lỗi xảy ra!");
    }
  };
  return (
    <div>
      {user ? (
        <h1>Chào mừng {user.username} đến với QQNA Chat!</h1>
      ) : (
        <h1>Đang tải thông tin người dùng...</h1>
      )}
      <Logout />
      <Button onClick={handletest}>Bắt đầu trò chuyện</Button>
    </div>
  );
};

export default ChatAppPage;
