import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

export function formatTime(sec: number) {
  const s = Math.ceil(Math.max(0, sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Shared by every level: a dark panel at the top left with a big clock, the level name, and a draining bar.
// The panel stays readable over any background; the clock turns red and pulses when time is nearly out.
export default function TimerBar({ remaining, limit, label, paused }: { remaining: number; limit: number; label?: string; paused?: boolean }) {
  const frac = Math.max(0, Math.min(1, remaining / limit));
  const urgent = remaining <= Math.min(10, limit / 3);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!urgent || paused) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [urgent, paused, pulse]);

  return (
    <View style={[styles.wrap, urgent && styles.wrapUrgent]}>
      <View style={styles.row}>
        <Animated.Text style={[styles.time, urgent && styles.urgent, { opacity: pulse }]}>
          {paused ? '⏸ ' : ''}
          {formatTime(remaining)}
        </Animated.Text>
        <Text style={styles.label} numberOfLines={2}>
          {label ?? ''}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${frac * 100}%` }, urgent && { backgroundColor: colors.bloodBright }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch', marginBottom: 16, padding: 10, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.72)', borderWidth: 1, borderColor: colors.blood,
  },
  wrapUrgent: { borderColor: colors.bloodBright },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  time: { color: colors.text, fontSize: 40, fontWeight: '900', fontVariant: ['tabular-nums'], minWidth: 96 },
  urgent: { color: colors.bloodBright },
  label: { flex: 1, color: colors.dim, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'right', marginLeft: 12 },
  track: { height: 8, backgroundColor: colors.panel, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.blood },
});
