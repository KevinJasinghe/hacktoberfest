import { useAudioPlayer } from 'expo-audio';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import * as haptics from './haptics';
import { colors } from './theme';

const SCARE_MS = 1600;
const SCARE_LINES = ['GET OUT', 'I SEE YOU', 'TOO SLOW', 'YOU ARE MINE', 'BEHIND YOU'];

const FACES = {
  doll: require('../assets/jumpscare/doll.jpg'),
  nun: require('../assets/jumpscare/nun.jpg'),
} as const;

type FaceKind = keyof typeof FACES;
type Burst = { id: number; line: string; face: FaceKind };

// playScare is a sound-only hit (the story's lunges use it); scare() is the full-screen face and scream.
type Jumpscare = { scare: (line?: string) => void; playGhost: () => void; playScare: () => void };
const Ctx = createContext<Jumpscare>({ scare: () => {}, playGhost: () => {}, playScare: () => {} });
export const useJumpscare = () => useContext(Ctx);

// Full-screen face that lunges into the camera, plus a scream. It closes on its own; game timers keep running.
export function JumpscareProvider({ children }: { children: ReactNode }) {
  const scream = useAudioPlayer(require('../assets/audio/scream.wav'));
  const ghost = useAudioPlayer(require('../assets/audio/ghost.wav'));
  // Short horror hits for story lunges that need a sound but not the full face and scream.
  const hits = [
    useAudioPlayer(require('../assets/audio/scare-high.wav')),
    useAudioPlayer(require('../assets/audio/scare-mid.wav')),
    useAudioPlayer(require('../assets/audio/scare-bass.wav')),
  ];
  const [burst, setBurst] = useState<Burst | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const burstId = useRef(0);

  // A delayed call (Level 3 fires one from a timer) can outlive its player; touching a released player throws.
  const play = (p: ReturnType<typeof useAudioPlayer>) => {
    // Touching a released player throws, and a promise can reject, so neither may escape.
    try {
      p.volume = 1;
      p.seekTo(0).then(() => p.play()).catch(() => {});
    } catch (e) {
      console.warn('[jumpscare] sound failed:', e instanceof Error ? e.message : e);
    }
  };

  const playScare = () => play(hits[Math.floor(Math.random() * hits.length)]);

  const scare = (line?: string) => {
    haptics.scare();
    play(scream);
    burstId.current += 1;
    setBurst({
      id: burstId.current,
      line: line ?? SCARE_LINES[Math.floor(Math.random() * SCARE_LINES.length)],
      face: Math.random() < 0.5 ? 'doll' : 'nun',
    });
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setBurst(null), SCARE_MS);
  };

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  return (
    <Ctx.Provider value={{ scare, playGhost: () => play(ghost), playScare }}>
      {children}
      {burst && <ScareBurst key={burst.id} face={burst.face} line={burst.line} />}
    </Ctx.Provider>
  );
}

function ScareBurst({ face, line }: { face: FaceKind; line: string }) {
  const { width, height } = useWindowDimensions();
  const lunge = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const slam = Animated.sequence([
      Animated.delay(50),
      Animated.timing(lunge, { toValue: 1, duration: 120, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(lunge, { toValue: 0.93, duration: 45, useNativeDriver: true }),
      Animated.delay(240),
      Animated.timing(lunge, { toValue: 1.14, duration: 60, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]);
    const blink = Animated.sequence([
      Animated.delay(50),
      Animated.timing(flash, { toValue: 1, duration: 16, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 90, useNativeDriver: true }),
      Animated.delay(299),
      Animated.timing(flash, { toValue: 0.92, duration: 16, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 70, useNativeDriver: true }),
    ]);
    const jitter = Animated.loop(
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 28, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 28, useNativeDriver: true }),
      ]),
      { iterations: 24 },
    );
    slam.start();
    blink.start();
    const jitterDelay = setTimeout(() => jitter.start(), 50);
    return () => {
      clearTimeout(jitterDelay);
      slam.stop();
      blink.stop();
      jitter.stop();
    };
  }, [flash, lunge, shake]);

  const scale = lunge.interpolate({ inputRange: [0, 1], outputRange: [0.15, 1.65] });
  const rise = lunge.interpolate({ inputRange: [0, 1], outputRange: [110, -8] });
  const appear = lunge.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 1] });
  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-18, 18] });
  const translateY = shake.interpolate({ inputRange: [-1, 1], outputRange: [12, -12] });
  const tilt = shake.interpolate({ inputRange: [-1, 1], outputRange: ['-2deg', '2deg'] });
  const cut = shake.interpolate({ inputRange: [-1, -0.45, 0, 1], outputRange: [0.72, 0, 0, 0] });

  const frameW = Math.min(width * 0.96, 520);
  const frameH = Math.min(height * 0.9, 760);

  return (
    <View style={styles.scare}>
      <Animated.View style={[styles.stage, { transform: [{ translateX }, { translateY }, { rotate: tilt }] }]}>
        <Animated.Image
          source={FACES[face]}
          resizeMode="cover"
          style={{ width: frameW, height: frameH, opacity: appear, transform: [{ translateY: rise }, { scale }] }}
        />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.cut, { opacity: cut }]} />
      <View style={styles.caption}>
        <Text style={styles.text}>{line}</Text>
      </View>
      <Animated.View pointerEvents="none" style={[styles.flash, { opacity: flash }]} />
    </View>
  );
}

// Schedules 1-2 surprise jumpscares at random points while the component is mounted (one run).
export function useRandomScares() {
  const { scare } = useJumpscare();
  const scareRef = useRef(scare);
  scareRef.current = scare;
  useEffect(() => {
    const delays = [20 + Math.random() * 50];
    if (Math.random() < 0.5) delays.push(90 + Math.random() * 60);
    const timers = delays.map((s) => setTimeout(() => scareRef.current(), s * 1000));
    return () => timers.forEach(clearTimeout);
  }, []);
}

const styles = StyleSheet.create({
  scare: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
    backgroundColor: '#000', overflow: 'hidden',
  },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cut: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000' },
  flash: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff' },
  caption: { position: 'absolute', left: 0, right: 0, bottom: 28, alignItems: 'center' },
  text: {
    color: '#fff', fontSize: 42, fontWeight: '900', letterSpacing: 4,
    textShadowColor: colors.bg, textShadowRadius: 16,
  },
});
