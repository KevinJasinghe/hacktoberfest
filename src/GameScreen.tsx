import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import CellarBackground from './CellarBackground';
import DungeonBackground from './DungeonBackground';
import Level1 from './Level1';
import Level2 from './Level2';
import Level3 from './Level3';
import { useJumpscare, useRandomScares } from './Jumpscare';
import { LevelProps } from './levels';
import { LEVEL_LIMITS, levelPoints, totalScore } from './scoring';
import { colors, ui } from './theme';

export type RunResult = {
  levelTimes: number[]; // seconds spent per level, including failed attempts
  levelPoints: number[];
  timeouts: number;
  totalScore: number;
  totalTime: number;
};

const LIMITS = [LEVEL_LIMITS[1], LEVEL_LIMITS[2], LEVEL_LIMITS[3]];
const LAST_LEVEL = 2;

// Runs Levels 1 → 3 in order. A timeout remounts the current level (new attempt) and costs points.
export default function GameScreen({
  onFinish,
  startLevel = 0,
}: {
  onFinish: (r: RunResult) => void;
  startLevel?: number;
}) {
  const [level, setLevel] = useState(startLevel);
  const [attempt, setAttempt] = useState(0);
  const [times, setTimes] = useState([0, 0, 0]);
  const [points, setPoints] = useState<number[]>(() => Array(startLevel).fill(0));
  const [timeouts, setTimeouts] = useState(0);
  const level3Objects = useRef<string[] | null>(null); // kept across a Level 3 timeout, cleared when the run restarts
  const { scare } = useJumpscare();
  useRandomScares();

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
    if (level < LAST_LEVEL) {
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
    scare();
    addTime(spent);
    setTimeouts(timeouts + 1);
    setAttempt(attempt + 1);
  };

  // A wrong Level 3 photo sends the player back to Level 1 with a fresh score.
  const restartRun = () => {
    level3Objects.current = null;
    setLevel(0);
    setAttempt(attempt + 1);
    setTimes([0, 0, 0]);
    setPoints([]);
    setTimeouts(0);
  };

  const skipLevel = () => {
    if (level >= LAST_LEVEL) return;
    setPoints((prev) => [...prev, 0]);
    setLevel(level + 1);
    setAttempt(0);
  };

  const key = `${level}-${attempt}`;
  const props: LevelProps = { onClear, onTimeout, attempt };
  return (
    <View style={ui.screen}>
      {level === 0 && <CellarBackground />}
      {level === 1 && <DungeonBackground />}
      {level === 0 && <Level1 key={key} {...props} />}
      {level === 1 && <Level2 key={key} {...props} />}
      {level === 2 && <Level3 key={key} {...props} onWrong={restartRun} objectsRef={level3Objects} />}
      {__DEV__ && level < LAST_LEVEL && (
        <Pressable
          onPress={skipLevel}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 20,
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: colors.dim,
          }}
        >
          <Text style={{ color: colors.dim, fontSize: 12, fontWeight: '700' }}>SKIP</Text>
        </Pressable>
      )}
    </View>
  );
}
