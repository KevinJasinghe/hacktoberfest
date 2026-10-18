export const LEVEL_LIMITS = { 1: 180, 2: 180, 3: 150 } as const;
export const LEVEL3_ITEM_LIMITS = [60, 60, 30];
export const MIN_LEVEL_POINTS = 100;
export const TIMEOUT_PENALTY = 250;

// Points for clearing a level. For Level 3, pass the summed time left on each item's timer.
export function levelPoints(secondsRemaining: number, limit: number): number {
  const raw = Math.round((1000 * Math.max(0, secondsRemaining)) / limit);
  return Math.max(MIN_LEVEL_POINTS, raw);
}

export function totalScore(levelPointsList: number[], timeouts: number): number {
  const sum = levelPointsList.reduce((a, b) => a + b, 0);
  return Math.max(0, sum - timeouts * TIMEOUT_PENALTY);
}

export type RankedRun = { score: number; time: number };

// Higher score first; ties go to the faster total time.
export function compareRuns(a: RankedRun, b: RankedRun): number {
  return b.score - a.score || a.time - b.time;
}
