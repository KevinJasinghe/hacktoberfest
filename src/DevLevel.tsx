import { Pressable, Text, View } from 'react-native';
import TimerBar from './TimerBar';
import { useCountdown } from './useCountdown';
import { ui } from './theme';

// Temporary stand-in used while a level isn't built yet: clear it or force a timeout.
export default function DevLevel({ title, limit, onClear, onTimeout }: { title: string; limit: number; onClear: (remaining: number, spent: number) => void; onTimeout: (spent: number) => void }) {
  const t = useCountdown(limit, { onExpire: () => onTimeout(limit) });
  return (
    <View>
      <TimerBar remaining={t.remaining} limit={limit} label={title} />
      <Text style={ui.dim}>Placeholder level</Text>
      <Pressable style={ui.button} onPress={() => onClear(t.remaining, t.elapsed)}>
        <Text style={ui.buttonText}>CLEAR LEVEL</Text>
      </Pressable>
      <Pressable style={ui.buttonGhost} onPress={() => onTimeout(limit)}>
        <Text style={ui.buttonText}>FORCE TIMEOUT</Text>
      </Pressable>
    </View>
  );
}
