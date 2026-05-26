import { playUiSound, type UiSoundEffect } from "@/lib/notificationSound";
import { useNotificationSettingsStore } from "@/stores/useNotificationSettingsStore";

export const playActionSound = (effect: UiSoundEffect) => {
  const { actionSoundEnabled, soundVolume } =
    useNotificationSettingsStore.getState();

  if (!actionSoundEnabled) return;

  playUiSound(soundVolume, effect).catch((error) => {
    console.error("Không thể phát âm thao tác:", error);
  });
};
