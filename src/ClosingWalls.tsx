import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { SCREEN_BLEED } from './theme';

const START_SEC = 60; // the walls begin closing in with this much time left
const MAX_BORDER = 70;

// A dark frame that thickens, and flickers like a dying candle, as the timer runs down.
export default function ClosingWalls({ remaining }: { remaining: number }) {
  const flicker = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, { toValue: 0.55, duration: 140, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0.8, duration: 260, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [flicker]);

  const closeness = Math.max(0, Math.min(1, (START_SEC - remaining) / START_SEC));
  if (closeness === 0) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.walls, { borderWidth: closeness * MAX_BORDER, opacity: flicker }]}
    />
  );
}

const styles = StyleSheet.create({
  walls: { position: 'absolute', ...SCREEN_BLEED, borderColor: 'rgba(0,0,0,0.88)', zIndex: 10 },
});
