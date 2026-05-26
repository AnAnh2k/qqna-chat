import { Bell, MessageCircle, Moon, Sun, Volume2, VolumeX } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useThemeStore } from "@/stores/useThemeStore";
import { useState } from "react";
import { useNotificationSettingsStore } from "@/stores/useNotificationSettingsStore";
import {
  messageSoundOptions,
  playMessageSound,
  type MessageSoundId,
} from "@/lib/notificationSound";
import { toast } from "sonner";

const PreferencesForm = () => {
  const { isDark, toggleTheme } = useThemeStore();
  const {
    desktopNotificationsEnabled,
    actionSoundEnabled,
    messageSoundId,
    messageSoundEnabled,
    messageToastEnabled,
    setDesktopNotificationsEnabled,
    setActionSoundEnabled,
    setMessageSoundId,
    setMessageSoundEnabled,
    setMessageToastEnabled,
    setSoundVolume,
    soundVolume,
  } = useNotificationSettingsStore();

  //   các bạn cần handle logic setOnlineStatus
  const [onlineStatus, setOnlineStatus] = useState(false);
  const [requestingNotification, setRequestingNotification] = useState(false);

  const handleDesktopNotificationChange = async (enabled: boolean) => {
    try {
      setRequestingNotification(true);
      await setDesktopNotificationsEnabled(enabled);

      if (
        enabled &&
        "Notification" in window &&
        Notification.permission !== "granted"
      ) {
        toast.error("Trình duyệt chưa cho phép thông báo.");
      }
    } finally {
      setRequestingNotification(false);
    }
  };

  const handleTestSound = () => {
    playMessageSound(soundVolume, messageSoundId).catch(() => {
      toast.error("Trình duyệt đang chặn âm thanh. Hãy tương tác lại trang.");
    });
  };

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-primary" />
          Tuỳ chỉnh ứng dụng
        </CardTitle>
        <CardDescription>
          Cá nhân hoá trải nghiệm trò chuyện của bạn
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Dark Mode */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="theme-toggle" className="text-base font-medium">
              Chế độ tối
            </Label>
            <p className="text-sm text-muted-foreground">
              Chuyển đổi giữa giao diện sáng và tối
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-muted-foreground" />
            <Switch
              id="theme-toggle"
              checked={isDark}
              onCheckedChange={toggleTheme}
              className="data-[state=checked]:bg-primary-glow"
            />
            <Moon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Online Status */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="online-status" className="text-base font-medium">
              Hiển thị trạng thái online
            </Label>
            <p className="text-sm text-muted-foreground">
              Cho phép người khác thấy khi bạn đang online
            </p>
          </div>
          <Switch
            id="online-status"
            checked={onlineStatus}
            onCheckedChange={setOnlineStatus}
            className="data-[state=checked]:bg-primary-glow"
          />
        </div>

        <div className="border-t border-border/30 pt-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="message-sound" className="text-base font-medium">
                Âm báo tin nhắn
              </Label>
              <p className="text-sm text-muted-foreground">
                Phát âm thanh khi có tin nhắn mới
              </p>
            </div>
            <div className="flex items-center gap-2">
              {messageSoundEnabled ? (
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
              <Switch
                id="message-sound"
                checked={messageSoundEnabled}
                onCheckedChange={setMessageSoundEnabled}
                className="data-[state=checked]:bg-primary-glow"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="action-sound" className="text-base font-medium">
                Âm thao tác
              </Label>
              <p className="text-sm text-muted-foreground">
                Phát âm khi chọn chat, gửi, react, tạo, sửa hoặc xóa
              </p>
            </div>
            <div className="flex items-center gap-2">
              {actionSoundEnabled ? (
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
              <Switch
                id="action-sound"
                checked={actionSoundEnabled}
                onCheckedChange={setActionSoundEnabled}
                className="data-[state=checked]:bg-primary-glow"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message-sound-type" className="text-base font-medium">
              Kiểu âm thanh
            </Label>
            <select
              id="message-sound-type"
              value={messageSoundId}
              disabled={!messageSoundEnabled}
              onChange={(event) =>
                setMessageSoundId(event.target.value as MessageSoundId)
              }
              className="h-10 w-full rounded-md border border-border/50 bg-background px-3 text-sm outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {messageSoundOptions.map((sound) => (
                <option key={sound.id} value={sound.id}>
                  {sound.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="sound-volume" className="text-base font-medium">
                Âm lượng
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestSound}
                disabled={!messageSoundEnabled}
              >
                <Volume2 className="size-4" />
                Thử
              </Button>
            </div>
            <input
              id="sound-volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={soundVolume}
              disabled={!messageSoundEnabled}
              onChange={(event) => setSoundVolume(Number(event.target.value))}
              className="w-full accent-primary disabled:opacity-50"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="message-toast" className="text-base font-medium">
                Thông báo trong app
              </Label>
              <p className="text-sm text-muted-foreground">
                Hiện pop-up khi có tin nhắn mới
              </p>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <Switch
                id="message-toast"
                checked={messageToastEnabled}
                onCheckedChange={setMessageToastEnabled}
                className="data-[state=checked]:bg-primary-glow"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label
                htmlFor="desktop-notification"
                className="text-base font-medium"
              >
                Thông báo trình duyệt
              </Label>
              <p className="text-sm text-muted-foreground">
                Hiện thông báo khi tab QQNA không mở trước mắt
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Switch
                id="desktop-notification"
                checked={desktopNotificationsEnabled}
                disabled={requestingNotification}
                onCheckedChange={handleDesktopNotificationChange}
                className="data-[state=checked]:bg-primary-glow"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PreferencesForm;
