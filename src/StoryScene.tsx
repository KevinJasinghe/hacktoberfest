import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import * as haptics from './haptics';
import { useJumpscare } from './Jumpscare';
import type { Beat } from './story';
import SceneBackground from './SceneBackground';
import { spriteFor } from './storyAssets';
import { colors, SCREEN_BLEED } from './theme';
import Typewriter from './Typewriter';

const loop = (value: Animated.Value, from: number, to: number, ms: number) =>
  Animated.loop(
    Animated.sequence([
      Animated.timing(value, { toValue: to, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(value, { toValue: from, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]),
  );

const speakerColor = (b: Beat) => (b.who === 'ghost' && b.mood === 'cute' ? '#cfe8ff' : b.who === 'none' ? colors.dim : b.who === 'skeleton' ? colors.text : colors.bloodBright);
const speakerName = (b: Beat) => (b.who === 'ghost' ? 'THE KEEPER' : b.who === 'skeleton' ? 'THE PRISONER' : '');

// A cutscene: the dungeon door, a floating character and typed-out dialogue. Tap to finish a line,
// tap again for the next one; the last tap hands control back. The caller pauses its timer meanwhile.
export default function StoryScene({ beats, onDone }: { beats: Beat[]; onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const { playGhost } = useJumpscare();
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false); // current line fully typed
  const [skipToken, setSkipToken] = useState(0);
  const beat = beats[index];

  const enter = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const flicker = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const dark = useRef(new Animated.Value(0)).current; // blackout overlay
  const flash = useRef(new Animated.Value(0)).current; // red flash on a lunge
  const ghostPlayed = useRef(false);

  // Ambient loops: the character bobs, the "candle" flickers.
  useEffect(() => {
    const a = loop(float, 0, 1, 1500);
    const b = loop(flicker, 0, 1, 380);
    a.start();
    b.start();
    return () => {
      a.stop();
      b.stop();
    };
  }, [float, flicker]);

  // Each beat: fade the character in and, on creepy beats, rattle the scene.
  useEffect(() => {
    const creepy = beat.mood === 'creepy';
    enter.setValue(0);
    Animated.timing(enter, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    if (beat.fx === 'blackout') {
      haptics.warn();
      Animated.sequence([
        Animated.timing(dark, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.delay(900),
        Animated.timing(dark, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    }
    if (beat.fx === 'lunge') {
      haptics.scare();
      flash.setValue(0.55);
      Animated.timing(flash, { toValue: 0, duration: 500, useNativeDriver: true }).start();
    }
    if (creepy && beat.who !== 'none') {
      if (beat.fx !== 'lunge') haptics.warn();
      if (!ghostPlayed.current) {
        ghostPlayed.current = true;
        playGhost();
      }
      Animated.sequence(
        [10, -10, 7, -7, 3, 0].map((toValue) => Animated.timing(shake, { toValue, duration: 55, useNativeDriver: true })),
      ).start();
      pulse.setValue(1);
      Animated.sequence([
        Animated.timing(pulse, { toValue: beat.fx === 'lunge' ? 1.7 : 1.12, duration: beat.fx === 'lunge' ? 140 : 160, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: beat.fx === 'lunge' ? 520 : 260, useNativeDriver: true }),
      ]).start();
    }
  }, [index]);

  const advance = () => {
    if (!done) return setSkipToken((n) => n + 1);
    if (index + 1 < beats.length) {
      setDone(false);
      setIndex(index + 1);
    } else onDone();
  };

  const sprite = spriteFor(beat.who, beat.mood);
  const spriteSize = sprite ? Image.resolveAssetSource(sprite) : null;
  const spriteHeight = height * 0.42;
  const spriteWidth = spriteSize ? (spriteHeight * spriteSize.width) / spriteSize.height : 0;
  const bob = float.interpolate({ inputRange: [0, 1], outputRange: [-9, 9] });
  const rise = enter.interpolate({ inputRange: [0, 1], outputRange: [36, 0] });

  return (
    <Animated.View style={[styles.scene, { transform: [{ translateX: shake }] }]}>
      <SceneBackground name={beat.bg} />
      <View style={[StyleSheet.absoluteFill, styles.dim]} />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.flicker, { opacity: flicker.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.35] }) }]}
      />

      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.blackout, { opacity: dark }]} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, { opacity: flash }]} />

      {/* The scene is one big tap target; the skip link sits on top of it. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={advance} />

      {sprite && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.sprite,
            {
              width: spriteWidth,
              height: spriteHeight,
              left: (width - spriteWidth) / 2,
              opacity: enter,
              transform: [{ translateY: Animated.add(rise, bob) }, { scale: pulse }, { rotate: float.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '2deg'] }) }],
            },
          ]}
        >
          <Image source={sprite} resizeMode="contain" style={{ width: spriteWidth, height: spriteHeight }} />
        </Animated.View>
      )}

      <View pointerEvents="none" style={styles.box}>
        {!!speakerName(beat) && <Text style={[styles.speaker, { color: speakerColor(beat) }]}>{speakerName(beat)}</Text>}
        <Typewriter
          key={`${beat.line}-${index}`}
          text={beat.line}
          skipToken={skipToken}
          onComplete={() => setDone(true)}
          style={[styles.line, beat.who === 'none' && { fontStyle: 'italic', color: colors.dim }]}
        />
        <View style={styles.footer}>
          <View style={styles.dots}>
            {beats.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
          <Text style={[styles.hint, { opacity: done ? 1 : 0 }]}>tap to continue ▸</Text>
        </View>
      </View>

      <Pressable style={styles.skip} onPress={onDone} hitSlop={12}>
        <Text style={styles.skipText}>SKIP ▸▸</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scene: { position: 'absolute', ...SCREEN_BLEED, backgroundColor: '#000', zIndex: 30, overflow: 'hidden' },
  dim: { backgroundColor: 'rgba(0,0,0,0.38)' },
  flicker: { backgroundColor: '#000' },
  blackout: { backgroundColor: '#000' },
  flash: { backgroundColor: colors.bloodBright },
  sprite: { position: 'absolute', bottom: 190 },
  box: {
    position: 'absolute', left: 20, right: 20, bottom: 48, padding: 16, borderRadius: 12,
    backgroundColor: 'rgba(8,2,2,0.88)', borderWidth: 1, borderColor: colors.blood,
  },
  speaker: { fontSize: 13, fontWeight: '900', letterSpacing: 3, marginBottom: 6 },
  line: { color: colors.text, fontSize: 19, lineHeight: 27, minHeight: 54 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#3a1414' },
  dotActive: { backgroundColor: colors.bloodBright },
  hint: { color: colors.dim, fontSize: 13, fontStyle: 'italic' },
  skip: { position: 'absolute', top: 64, right: 20 },
  skipText: { color: colors.dim, fontSize: 13, fontWeight: '800', letterSpacing: 2 },
});
