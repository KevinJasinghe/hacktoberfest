import { useState } from 'react';
import { View } from 'react-native';
import Level1 from './Level1';
import Level2 from './Level2';
import Level3 from './Level3';
import { LevelProps } from './levels';
import { LEVEL_LIMITS, levelPoints, totalScore } from './scoring';
import { ui } from './theme';

export type RunResult = {
  levelTimes: number[]; // seconds spent per level, including failed attempts
  levelPoints: number[];
  timeouts: number;
  totalScore: number;
  totalTime: number;
};

const LEVELS: ((p: LevelProps) => React.JSX.Element)[] = [Level1, Level2, Level3];
const LIMITS = [LEVEL_LIMITS[1], LEVEL_LIMITS[2], LEVEL_LIMITS[3]];

// Runs Levels 1 → 3 in order. A timeout remounts the current level (new attempt) and costs points.
export default function GameScreen({ onFinish }: { onFinish: (r: RunResult) => void }) {
  const [level, setLevel] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [times, setTimes] = useState([0, 0, 0]);
  const [points, setPoints] = useState<number[]>([]);
  const [timeouts, setTimeouts] = useState(0);

  const addTime = (spent: number) => {
    const next = [...times];
    next[level] += spent;
    setTimes(next);
    return next;
  };

  const onClear = (secondsRemaining: number, spent: number) => {
    const nextTimes = addTime(spent);
    const nextPoints = [...points, levelPoints(secondsRemaining, LIMITS[level])];
    setPoints(nextPoints);
    if (level < LEVELS.length - 1) {
      setLevel(level + 1);
      setAttempt(0);
      return;
    }
    const round1 = (n: number) => Math.round(n * 10) / 10;
    onFinish({
      levelTimes: nextTimes.map(round1),
      levelPoints: nextPoints,
      timeouts,
      totalScore: totalScore(nextPoints, timeouts),
      totalTime: round1(nextTimes.reduce((a, b) => a + b, 0)),
    });
  };

  const onTimeout = (spent: number) => {
    addTime(spent);
    setTimeouts(timeouts + 1);
    setAttempt(attempt + 1);
  };

  const Level = LEVELS[level];
  return (
    <View style={ui.screen}>
      <Level key={`${level}-${attempt}`} onClear={onClear} onTimeout={onTimeout} />
    </View>
  );
}
