import type { NotificationSettingsState } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useNotificationSettingsStore =
  create<NotificationSettingsState>()(
    persist(
      (set) => ({
        messageSoundEnabled: true,
        actionSoundEnabled: true,
        messageToastEnabled: true,
        desktopNotificationsEnabled: false,
        messageSoundId: "classic",
        soundVolume: 0.5,
        setMessageSoundEnabled: (enabled) =>
          set({ messageSoundEnabled: enabled }),
        setActionSoundEnabled: (enabled) =>
          set({ actionSoundEnabled: enabled }),
        setMessageToastEnabled: (enabled) =>
          set({ messageToastEnabled: enabled }),
        setDesktopNotificationsEnabled: async (enabled) => {
          if (!enabled) {
            set({ desktopNotificationsEnabled: false });
            return;
          }

          if (!("Notification" in window)) {
            set({ desktopNotificationsEnabled: false });
            return;
          }

          if (Notification.permission === "default") {
            await Notification.requestPermission();
          }

          set({
            desktopNotificationsEnabled: Notification.permission === "granted",
          });
        },
        setMessageSoundId: (soundId) => set({ messageSoundId: soundId }),
        setSoundVolume: (volume) =>
          set({ soundVolume: Math.min(1, Math.max(0, volume)) }),
      }),
      {
        name: "notification-settings",
      },
    ),
  );
