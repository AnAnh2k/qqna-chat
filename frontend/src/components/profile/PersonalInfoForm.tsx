import { Heart } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/user";
import ConfirmDialog from "../common/ConfirmDialog";
import { useUserStore } from "@/stores/useUserStore";

type EditableField = {
  key: keyof Pick<User, "displayName" | "email" | "phone">;
  label: string;
  type?: string;
};

const PERSONAL_FIELDS: EditableField[] = [
  { key: "displayName", label: "Tên hiển thị" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Số điện thoại" },
];

type Props = {
  userInfo: User | null;
};

const PersonalInfoForm = ({ userInfo }: Props) => {
  const updateProfile = useUserStore((s) => s.updateProfile);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    username: "",
    email: "",
    phone: "",
    bio: "",
  });

  useEffect(() => {
    if (!userInfo) return;
    setForm({
      displayName: userInfo.displayName ?? "",
      username: userInfo.username ?? "",
      email: userInfo.email ?? "",
      phone: userInfo.phone ?? "",
      bio: userInfo.bio ?? "",
    });
  }, [userInfo]);

  const hasChanges = useMemo(() => {
    if (!userInfo) return false;

    return (
      form.displayName !== (userInfo.displayName ?? "") ||
      form.email !== (userInfo.email ?? "") ||
      form.phone !== (userInfo.phone ?? "") ||
      form.bio !== (userInfo.bio ?? "")
    );
  }, [form, userInfo]);

  if (!userInfo) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasChanges || saving) return;
    setConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    try {
      setSaving(true);
      await updateProfile({
        displayName: form.displayName,
        email: form.email,
        phone: form.phone,
        bio: form.bio,
      });
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card className="glass-strong border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="size-5 text-primary" />
            Thông tin cá nhân
          </CardTitle>
          <CardDescription>
            Cập nhật chi tiết cá nhân và thông tin hồ sơ của bạn
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Tên người dùng</Label>
                <Input
                  id="username"
                  value={form.username}
                  readOnly
                  className="glass-light border-border/30 bg-muted/40 text-muted-foreground"
                />
              </div>

              {PERSONAL_FIELDS.map(({ key, label, type }) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>{label}</Label>
                  <Input
                    id={key}
                    type={type ?? "text"}
                    value={form[key]}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                    className="glass-light border-border/30"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Giới thiệu</Label>
              <Textarea
                id="bio"
                rows={3}
                value={form.bio}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    bio: event.target.value,
                  }))
                }
                className="glass-light border-border/30 resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={!hasChanges || saving}
              className="w-full md:w-auto bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              Lưu thay đổi
            </Button>
          </form>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Xác nhận thay đổi"
        description="Bạn có chắc chắn muốn lưu các thay đổi thông tin cá nhân này không?"
        confirmText="Lưu thay đổi"
        loading={saving}
        onConfirm={handleConfirmSave}
      />
    </>
  );
};

export default PersonalInfoForm;
