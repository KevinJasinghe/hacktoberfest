import { useRef, useState } from 'react';
import { View } from 'react-native';
import DungeonBackground from './DungeonBackground';
import Level1 from './Level1';
import Level2 from './Level2';
import Level3 from './Level3';
import { useJumpscare, useRandomScares } from './Jumpscare';
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

const LIMITS = [LEVEL_LIMITS[1], LEVEL_LIMITS[2], LEVEL_LIMITS[3]];
const LAST_LEVEL = 2;

// Runs Levels 1 → 3 in order. Losing a level (timeout or a wrong photo) moves on to the next one and costs points.
export default function GameScreen({ onFinish }: { onFinish: (r: RunResult) => void }) {
  const [level, setLevel] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [times, setTimes] = useState([0, 0, 0]);
  const [points, setPoints] = useState<number[]>([]);
  const [timeouts, setTimeouts] = useState(0);
  const level3Objects = useRef<string[] | null>(null);
  const { scare } = useJumpscare();
  useRandomScares();

  const addTime = (spent: number) => {
    const next = [...times];
    next[level] += spent;
    setTimes(next);
    return next;
  };

  // Ends the current level and moves on (or finishes the run after the last one). A level that was lost
  // scores 0 points and costs one timeout penalty; nothing ever resets.
  const finishLevel = (secondsRemaining: number, spent: number, lost = false) => {
    const nextTimes = addTime(spent);
    const nextPoints = [...points, lost ? 0 : levelPoints(secondsRemaining, LIMITS[level])];
    const nextTimeouts = lost ? timeouts + 1 : timeouts;
    setPoints(nextPoints);
    setTimeouts(nextTimeouts);
    if (level < LAST_LEVEL) {
      setLevel(level + 1);
      setAttempt(0);
      return;
    }
    const round1 = (n: number) => Math.round(n * 10) / 10;
    onFinish({
      levelTimes: nextTimes.map(round1),
      levelPoints: nextPoints,
      timeouts: nextTimeouts,
      totalScore: totalScore(nextPoints, nextTimeouts),
      totalTime: round1(nextTimes.reduce((a, b) => a + b, 0)),
    });
  };

  const onClear = (secondsRemaining: number, spent: number) => finishLevel(secondsRemaining, spent);

  // Running out of time loses the level: a scare, then straight on to the next one.
  const onTimeout = (spent: number) => {
    scare();
    finishLevel(0, spent, true);
  };

  // A wrong Level 3 photo loses that level too (Level 3 plays its own scare first).
  const onWrong = (spent: number) => finishLevel(0, spent, true);

  // A failure that costs points and gives a scare but lets the level carry on (Level 1's locks).
  const onPenalty = () => {
    scare();
    setTimeouts((n) => n + 1);
  };

  const key = `${level}-${attempt}`;
  const props: LevelProps = { onClear, onTimeout, onPenalty, attempt };
  return (
    <View style={ui.screen}>
      <DungeonBackground />
      {level === 0 && <Level1 key={key} {...props} />}
      {level === 1 && <Level2 key={key} {...props} />}
      {level === 2 && <Level3 key={key} {...props} onWrong={onWrong} objectsRef={level3Objects} />}
    </View>
  );
}
