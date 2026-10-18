import { StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

export function formatTime(sec: number) {
  const s = Math.ceil(Math.max(0, sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function TimerBar({ remaining, limit, label, paused }: { remaining: number; limit: number; label?: string; paused?: boolean }) {
  const frac = Math.max(0, Math.min(1, remaining / limit));
  const urgent = remaining <= 10;
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>{label ?? ''}</Text>
        <Text style={[styles.time, urgent && styles.urgent]}>
          {paused ? '⏸ ' : ''}
          {formatTime(remaining)}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${frac * 100}%` }, urgent && { backgroundColor: colors.bloodBright }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  label: { color: colors.dim, fontSize: 14, letterSpacing: 1, textTransform: 'uppercase' },
  time: { color: colors.text, fontSize: 28, fontWeight: '900', fontVariant: ['tabular-nums'] },
  urgent: { color: colors.bloodBright },
  track: { height: 8, backgroundColor: colors.panel, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.blood },
});
