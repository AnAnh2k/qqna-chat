import { useState, type FormEvent } from "react";
import { Shield, Bell, ShieldBan, KeyRound, Eye, EyeOff } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ConfirmDialog from "../common/ConfirmDialog";
import { userService } from "@/services/userService";
import { toast } from "sonner";

const initialPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const PrivacySettings = () => {
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [showPasswords, setShowPasswords] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const updatePasswordField = (
    key: keyof typeof passwordForm,
    value: string,
  ) => {
    setPasswordForm((current) => ({ ...current, [key]: value }));
  };

  const validatePasswordForm = () => {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast.error("Vui lòng nhập đầy đủ thông tin đổi mật khẩu.");
      return false;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return false;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Xác nhận mật khẩu mới không khớp.");
      return false;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error("Mật khẩu mới không được trùng mật khẩu hiện tại.");
      return false;
    }

    return true;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validatePasswordForm()) return;
    setConfirmOpen(true);
  };

  const handleChangePassword = async () => {
    try {
      setSaving(true);
      await userService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm(initialPasswordForm);
      setConfirmOpen(false);
      toast.success("Đổi mật khẩu thành công!");
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Đổi mật khẩu không thành công!";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card className="glass-strong border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Quyền riêng tư & Bảo mật
          </CardTitle>
          <CardDescription>
            Quản lý cài đặt quyền riêng tư và bảo mật của bạn
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form
            className="rounded-xl border border-border/30 bg-background/35 p-4"
            onSubmit={handleSubmit}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h4 className="flex items-center gap-2 font-semibold">
                  <KeyRound className="size-4 text-primary" />
                  Đổi mật khẩu
                </h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cập nhật mật khẩu để bảo vệ tài khoản của bạn.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowPasswords((current) => !current)}
                title={showPasswords ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPasswords ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                <Input
                  id="currentPassword"
                  type={showPasswords ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    updatePasswordField("currentPassword", event.target.value)
                  }
                  className="glass-light border-border/30"
                  autoComplete="current-password"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Mật khẩu mới</Label>
                  <Input
                    id="newPassword"
                    type={showPasswords ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      updatePasswordField("newPassword", event.target.value)
                    }
                    className="glass-light border-border/30"
                    autoComplete="new-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                  <Input
                    id="confirmPassword"
                    type={showPasswords ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(event) =>
                      updatePasswordField("confirmPassword", event.target.value)
                    }
                    className="glass-light border-border/30"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="mt-4 w-full md:w-auto"
              disabled={saving}
            >
              Đổi mật khẩu
            </Button>
          </form>

          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start glass-light border-border/30 hover:text-info"
            >
              <Bell className="h-4 w-4 mr-2" />
              Cài đặt thông báo
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start glass-light border-border/30 hover:text-destructive"
            >
              <ShieldBan className="size-4 mr-2" />
              Chặn & Báo cáo
            </Button>
          </div>

          <div className="pt-4 border-t border-border/30">
            <h4 className="font-medium mb-3 text-destructive">
              Khu vực nguy hiểm
            </h4>
            <Button variant="destructive" className="w-full">
              Xoá tài khoản
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Xác nhận đổi mật khẩu"
        description="Bạn có chắc chắn muốn đổi mật khẩu tài khoản hiện tại không?"
        confirmText="Đổi mật khẩu"
        loading={saving}
        icon={KeyRound}
        onConfirm={handleChangePassword}
      />
    </>
  );
};

export default PrivacySettings;
