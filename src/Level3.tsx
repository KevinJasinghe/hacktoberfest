import { useRef, useState } from 'react';
import { View } from 'react-native';
import DevLevel from './DevLevel';
import { LevelProps } from './levels';
import { LEVEL3_ITEM_LIMITS } from './scoring';

const STEP_NAMES = ['Object 1', 'Object 2', 'Selfie'];

// Three back-to-back item timers (1:00, 1:00, 0:30). Level points use the summed time left.
export default function Level3({ onClear, onTimeout }: LevelProps) {
  const [step, setStep] = useState(0);
  const left = useRef(0);
  const spent = useRef(0);

  const clearStep = (remaining: number, stepSpent: number) => {
    left.current += remaining;
    spent.current += stepSpent;
    if (step + 1 < LEVEL3_ITEM_LIMITS.length) setStep(step + 1);
    else onClear(left.current, spent.current);
  };

  return (
    <View>
      <DevLevel
        key={step}
        title={`Level 3 · The Attic · ${STEP_NAMES[step]}`}
        limit={LEVEL3_ITEM_LIMITS[step]}
        onClear={clearStep}
        onTimeout={(stepSpent) => onTimeout(spent.current + stepSpent)}
      />
    </View>
  );
}
