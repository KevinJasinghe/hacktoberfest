// Contract between GameScreen and each level. A level owns its timer(s) and reports back.
// timeSpent is timer time only (it excludes pauses while waiting on Gemma).
export type LevelProps = {
  onClear: (secondsRemaining: number, timeSpent: number) => void;
  onTimeout: (timeSpent: number) => void;
  onPenalty?: () => void; // a scare and a -250 timeout penalty, without resetting the level
  attempt?: number; // 0 on the first try of a level, +1 after each timeout reset
};
