let audioContext: AudioContext | null = null;

export type MessageSoundId =
  | "classic"
  | "pop"
  | "chime"
  | "ping"
  | "soft";

export type UiSoundEffect =
  | "select"
  | "send"
  | "react"
  | "success"
  | "create"
  | "remove";

export const messageSoundOptions: Array<{
  id: MessageSoundId;
  label: string;
}> = [
  { id: "classic", label: "QQNA Classic" },
  { id: "pop", label: "Pop" },
  { id: "chime", label: "Chime" },
  { id: "ping", label: "Ping" },
  { id: "soft", label: "Soft" },
];

const getAudioContext = () => {
  audioContext ??= new AudioContext();
  return audioContext;
};

const soundPatterns: Record<
  MessageSoundId | UiSoundEffect,
  Array<{
    frequency: number;
    start: number;
    duration: number;
    type?: OscillatorType;
  }>
> = {
  classic: [
    { frequency: 740, start: 0, duration: 0.16 },
    { frequency: 980, start: 0.09, duration: 0.23 },
  ],
  pop: [
    { frequency: 520, start: 0, duration: 0.08, type: "triangle" },
    { frequency: 650, start: 0.05, duration: 0.1, type: "triangle" },
  ],
  chime: [
    { frequency: 880, start: 0, duration: 0.18 },
    { frequency: 1320, start: 0.12, duration: 0.24 },
  ],
  ping: [{ frequency: 1040, start: 0, duration: 0.18 }],
  soft: [
    { frequency: 440, start: 0, duration: 0.18, type: "sine" },
    { frequency: 660, start: 0.1, duration: 0.22, type: "sine" },
  ],
  select: [{ frequency: 660, start: 0, duration: 0.05, type: "triangle" }],
  send: [
    { frequency: 620, start: 0, duration: 0.06, type: "triangle" },
    { frequency: 860, start: 0.05, duration: 0.09, type: "triangle" },
  ],
  react: [
    { frequency: 840, start: 0, duration: 0.05, type: "sine" },
    { frequency: 1180, start: 0.04, duration: 0.08, type: "sine" },
  ],
  success: [
    { frequency: 520, start: 0, duration: 0.08, type: "sine" },
    { frequency: 780, start: 0.07, duration: 0.12, type: "sine" },
  ],
  create: [
    { frequency: 500, start: 0, duration: 0.07, type: "triangle" },
    { frequency: 700, start: 0.06, duration: 0.09, type: "triangle" },
    { frequency: 940, start: 0.13, duration: 0.11, type: "triangle" },
  ],
  remove: [
    { frequency: 460, start: 0, duration: 0.08, type: "sawtooth" },
    { frequency: 320, start: 0.07, duration: 0.12, type: "sawtooth" },
  ],
};

const playSoundPattern = async (
  volume: number,
  soundId: MessageSoundId | UiSoundEffect,
) => {
  const context = getAudioContext();

  if (context.state === "suspended") {
    await context.resume();
  }

  const pattern = soundPatterns[soundId] ?? soundPatterns.classic;
  const now = context.currentTime;
  const gain = context.createGain();
  const endAt = Math.max(...pattern.map((tone) => tone.start + tone.duration));

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.18 * volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + endAt + 0.04);
  gain.connect(context.destination);

  pattern.forEach((tone) => {
    const oscillator = context.createOscillator();
    oscillator.type = tone.type ?? "sine";
    oscillator.frequency.setValueAtTime(tone.frequency, now + tone.start);
    oscillator.connect(gain);
    oscillator.start(now + tone.start);
    oscillator.stop(now + tone.start + tone.duration);
  });
};

export const playMessageSound = async (
  volume: number,
  soundId: MessageSoundId = "classic",
) => playSoundPattern(volume, soundId);

export const playUiSound = async (
  volume: number,
  effect: UiSoundEffect,
) => playSoundPattern(volume * 0.75, effect);
