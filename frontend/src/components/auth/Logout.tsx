import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "../ui/button";
import { useNavigate } from "react-router";
import { LogOut } from "lucide-react";
import { useState } from "react";
import ConfirmDialog from "../common/ConfirmDialog";

const Logout = () => {
  const { signOut } = useAuthStore();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOut();
      setConfirmOpen(false);
      navigate("/signin"); // điều hướng về trang đăng nhập sau khi đăng xuất thành công
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <Button variant={"completeGhost"} onClick={() => setConfirmOpen(true)}>
        <LogOut className="text-destructive" />
        Đăng xuất
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Xác nhận đăng xuất"
        description="Bạn có chắc chắn muốn đăng xuất khỏi tài khoản hiện tại không?"
        confirmText="Đăng xuất"
        variant="destructive"
        loading={loading}
        icon={LogOut}
        onConfirm={handleLogout}
      />
    </>
  );
};

export default Logout;
