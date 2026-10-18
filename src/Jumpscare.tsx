import { useAudioPlayer } from 'expo-audio';
import LottieView from 'lottie-react-native';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { SKULL } from './Loader';
import { colors } from './theme';

const SCARE_MS = 1800;
const SCARE_LINES = ['GET OUT', 'I SEE YOU', 'TOO SLOW', 'YOU ARE MINE', 'BEHIND YOU'];

type Jumpscare = { scare: () => void; playGhost: () => void };
const Ctx = createContext<Jumpscare>({ scare: () => {}, playGhost: () => {} });
export const useJumpscare = () => useContext(Ctx);

// Full-screen pop-up plus a sound. It closes on its own; game timers keep running underneath.
export function JumpscareProvider({ children }: { children: ReactNode }) {
  const sounds = [
    useAudioPlayer(require('../assets/audio/scare-high.wav')),
    useAudioPlayer(require('../assets/audio/scare-mid.wav')),
    useAudioPlayer(require('../assets/audio/scare-bass.wav')),
  ];
  const ghost = useAudioPlayer(require('../assets/audio/ghost.wav'));
  const [line, setLine] = useState<string | null>(null);
  const shake = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const play = (p: ReturnType<typeof useAudioPlayer>) => {
    p.seekTo(0);
    p.play();
  };

  const scare = () => {
    play(sounds[Math.floor(Math.random() * sounds.length)]);
    setLine(SCARE_LINES[Math.floor(Math.random() * SCARE_LINES.length)]);
    shake.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 40, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 40, useNativeDriver: true }),
      ]),
      { iterations: 10 },
    ).start();
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setLine(null), SCARE_MS);
  };

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-14, 14] });
  return (
    <Ctx.Provider value={{ scare, playGhost: () => play(ghost) }}>
      {children}
      {line && (
        <Animated.View style={[styles.scare, { transform: [{ translateX }] }]}>
          <LottieView source={SKULL} autoPlay loop speed={3} style={styles.skull} />
          <Text style={styles.text}>{line}</Text>
        </Animated.View>
      )}
    </Ctx.Provider>
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
    backgroundColor: 'rgba(150,0,0,0.85)', alignItems: 'center', justifyContent: 'center',
  },
  skull: { width: 320, height: 320 },
  text: { color: '#fff', fontSize: 48, fontWeight: '900', letterSpacing: 4, textShadowColor: colors.bg, textShadowRadius: 12 },
});
