import * as Haptics from 'expo-haptics';

// Fire-and-forget wrappers: a device without a haptic engine must never break the game.
const run = (p: Promise<void>) => p.catch(() => {});
const later = (ms: number, fn: () => void) => setTimeout(fn, ms);

export const tap = () => run(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
export const select = () => run(Haptics.selectionAsync());
export const wrong = () => run(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
export const warn = () => run(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));

// A lock clicking open: a heavy clunk, then the success buzz.
export const lockOpen = () => {
  run(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
  later(120, () => run(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)));
};

// Lub-dub, used once a second while the timer is nearly out.
export const heartbeat = () => {
  run(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  later(140, () => run(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)));
};

// Rapid hammering for jumpscares.
export const scare = () => {
  for (let i = 0; i < 6; i++) later(i * 90, () => run(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)));
};
