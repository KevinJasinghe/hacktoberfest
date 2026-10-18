// Contract between GameScreen and each level. A level owns its timer(s) and reports back.
// timeSpent is timer time only (it excludes pauses while waiting on Gemma).
export type LevelProps = {
  onClear: (secondsRemaining: number, timeSpent: number) => void;
  onTimeout: (timeSpent: number) => void;
};
