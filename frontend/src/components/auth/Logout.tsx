import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "../ui/button";
import { useNavigate } from "react-router";

const Logout = () => {
  const { signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/signin"); // điều hướng về trang đăng nhập sau khi đăng xuất thành công
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    }
  };
  return <Button onClick={handleLogout}>Đăng xuất</Button>;
};

export default Logout;
