import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, useWindowDimensions, View } from 'react-native';

const step = (a: Animated.Value, toValue: number, duration: number) =>
  Animated.timing(a, { toValue, duration, easing: Easing.linear, useNativeDriver: true });

// Full-screen dungeon backdrop behind the level, with a flickering torch glow and the odd cold flash.
// Sized to the window explicitly (not to its parent) so the screen's padding can't shift or crop it.
export default function DungeonBackground() {
  const { width, height } = useWindowDimensions();
  const torch = useRef(new Animated.Value(0.06)).current;
  const flash = useRef(new Animated.Value(0)).current;

  // Warm glow that never settles: random brightness every 80-250 ms.
  useEffect(() => {
    let alive = true;
    const next = () => {
      if (!alive) return;
      step(torch, 0.02 + Math.random() * 0.2, 80 + Math.random() * 170).start(next);
    };
    next();
    return () => {
      alive = false;
      torch.stopAnimation();
    };
  }, [torch]);

  // Rare cold flash: two quick stutters, then 2-6 s of darkness.
  useEffect(() => {
    let alive = true;
    let wait: ReturnType<typeof setTimeout> | undefined;
    const strike = () => {
      if (!alive) return;
      Animated.sequence([
        step(flash, 0.35, 40), step(flash, 0.05, 70),
        step(flash, 0.28, 50), step(flash, 0, 260),
      ]).start(() => {
        wait = setTimeout(strike, 2000 + Math.random() * 4000);
      });
    };
    wait = setTimeout(strike, 1500 + Math.random() * 2500);
    return () => {
      alive = false;
      clearTimeout(wait);
      flash.stopAnimation();
    };
  }, [flash]);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]}>
      <Image
        source={require('../assets/dungeon.jpeg')}
        resizeMode="cover"
        style={{ position: 'absolute', top: 0, left: 0, width, height }}
      />
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#ff7a1a', opacity: torch }]} />
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#bcd4ff', opacity: flash }]} />
    </View>
  );
}
