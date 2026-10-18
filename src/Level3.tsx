import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import LottieView from 'lottie-react-native';
import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { checkPhoto, pickObjects } from './gemma';
import { useJumpscare } from './Jumpscare';
import { LevelProps } from './levels';
import Loader, { SKULL } from './Loader';
import { LEVEL3_ITEM_LIMITS } from './scoring';
import TimerBar from './TimerBar';
import { colors, ui } from './theme';
import { useCountdown } from './useCountdown';

// Level 3: climb a stone hall, then photograph 3 objects Gemma picks and finish with a selfie.
// The objects are common enough to be in the room, with a Halloween theme.
// Gemma checks each photo. A wrong photo jumpscares and restarts the whole game.
// The selfie is not checked. A skeleton, ghost, or doll lurks in that shot.
type Props = LevelProps & { onWrong: () => void; objectsRef: MutableRefObject<string[] | null> };

type Target = { label: string; title: string; gemma: string };

const article = (name: string) => ('aeiou'.includes(name[0]) ? 'an' : 'a');
const titleCase = (name: string) => name.replace(/\b[a-z]/g, (c) => c.toUpperCase());

function toTarget(name: string): Target {
  const word = article(name);
  return { label: titleCase(name), title: `Photograph ${word} ${name}.`, gemma: `${word} real ${name}` };
}

const HALL_LINES = [
  'You step into the dark stone hall.',
  'The stairs keep climbing.',
  'Another landing. The walls are closer.',
  'The final door. It wants to see you.',
];

type CreatureKind = 'skeleton' | 'ghost' | 'doll';
const CREATURES: CreatureKind[] = ['skeleton', 'ghost', 'doll'];

export default function Level3({ onClear, onTimeout, onWrong, objectsRef }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [objects, setObjects] = useState<string[] | null>(objectsRef.current);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<'hall' | 'camera'>('hall');
  const left = useRef(0);
  const spent = useRef(0);

  useEffect(() => {
    if (objectsRef.current) return;
    let cancelled = false;
    pickObjects(3).then((picked) => {
      if (cancelled) return;
      objectsRef.current = picked;
      setObjects(picked);
    });
    return () => {
      cancelled = true;
    };
  }, [objectsRef]);

  if (!permission) return <Loader text="Something waits at the top of the stairs..." />;
  if (!permission.granted) {
    return (
      <View style={ui.center}>
        <Text style={[ui.body, { textAlign: 'center' }]}>The stone hall is pitch black. Let the spirit see through your camera.</Text>
        <Pressable style={ui.button} onPress={requestPermission}>
          <Text style={ui.buttonText}>ALLOW CAMERA</Text>
        </Pressable>
      </View>
    );
  }

  const clearStep = (remaining: number, stepSpent: number) => {
    left.current += remaining;
    spent.current += stepSpent;
    if (step + 1 < LEVEL3_ITEM_LIMITS.length) {
      setStep(step + 1);
      setPhase('hall');
      return;
    }
    onClear(left.current, spent.current);
  };

  if (phase === 'hall') {
    return (
      <Hallway
        key={step}
        line={HALL_LINES[step]}
        first={step === 0}
        onArrive={() => setPhase('camera')}
      />
    );
  }

  if (!objects) return <Loader text="The spirit is choosing what you must find..." />;
  const targets = objects.map(toTarget);

  return (
    <CameraStep
      key={step}
      step={step}
      target={step < targets.length ? targets[step] : null}
      objectCount={targets.length}
      onPass={clearStep}
      onWrong={onWrong}
      onTimeout={(stepSpent) => onTimeout(spent.current + stepSpent)}
    />
  );
}

function Hallway({ line, first, onArrive }: { line: string; first: boolean; onArrive: () => void }) {
  const walk = useRef(new Animated.Value(0)).current;
  const flicker = useRef(new Animated.Value(0.35)).current;
  const onArriveRef = useRef(onArrive);
  onArriveRef.current = onArrive;

  useEffect(() => {
    let active = true;
    const flames = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, { toValue: 0.95, duration: 90, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0.3, duration: 140, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0.75, duration: 70, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0.22, duration: 200, useNativeDriver: true }),
      ]),
    );
    flames.start();
    const climb = Animated.timing(walk, {
      toValue: 1,
      duration: first ? 3400 : 2300,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    });
    climb.start(({ finished }) => {
      if (!finished || !active) return;
      active = false;
      onArriveRef.current();
    });
    return () => {
      active = false;
      flames.stop();
      climb.stop();
    };
  }, [first, flicker, walk]);

  const wash = walk.interpolate({ inputRange: [0, 0.8, 1], outputRange: [0, 0, 1] });
  const caption = walk.interpolate({ inputRange: [0, 0.12, 0.78, 1], outputRange: [0, 1, 1, 0] });

  return (
    <View style={styles.hall}>
      <View style={styles.wallLeft} />
      <View style={styles.wallRight} />
      <View style={styles.door}>
        <LottieView source={SKULL} autoPlay loop speed={0.55} style={styles.farSkull} />
      </View>
      {STONE.map((color, i) => (
        <StoneFrame key={i} walk={walk} index={i} color={color} />
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <Stair key={i} walk={walk} index={i} />
      ))}
      <Torch flicker={flicker} side="left" />
      <Torch flicker={flicker} side="right" />
      <View pointerEvents="none" style={styles.vignette} />
      <Animated.View pointerEvents="none" style={[styles.wash, { opacity: wash }]} />
      <View style={styles.hallTop}>
        <Text style={styles.eyebrow}>STONE HALL</Text>
      </View>
      <Animated.Text style={[styles.hallText, { opacity: caption }]}>{line}</Animated.Text>
    </View>
  );
}

const STONE = ['#241f1b', '#3a322c', '#1a1613', '#4a3f36', '#2e2823', '#12100e'];

function StoneFrame({ walk, index, color }: { walk: Animated.Value; index: number; color: string }) {
  const scale = walk.interpolate({
    inputRange: [0, 1],
    outputRange: [0.16 + index * 0.11, 0.85 + index * 0.48],
  });
  const rise = walk.interpolate({ inputRange: [0, 1], outputRange: [36, -70] });
  const opacity = walk.interpolate({
    inputRange: [0, 0.72, 1],
    outputRange: [0.95, 0.85, index >= 4 ? 0 : 0.45],
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.frame, { borderColor: color, opacity, transform: [{ translateY: rise }, { scale }] }]}
    />
  );
}

function Stair({ walk, index }: { walk: Animated.Value; index: number }) {
  const translateY = walk.interpolate({
    inputRange: [0, 1],
    outputRange: [8 + index * 16, 150 + index * 52],
  });
  const scaleX = walk.interpolate({
    inputRange: [0, 1],
    outputRange: [0.22 + index * 0.07, 0.65 + index * 0.14],
  });
  return <Animated.View pointerEvents="none" style={[styles.stair, { opacity: 0.35 + index * 0.08, transform: [{ translateY }, { scaleX }] }]} />;
}

function Torch({ flicker, side }: { flicker: Animated.Value; side: 'left' | 'right' }) {
  return (
    <Animated.View pointerEvents="none" style={[styles.torch, side === 'left' ? styles.torchLeft : styles.torchRight, { opacity: flicker }]}>
      <View style={styles.flame} />
    </Animated.View>
  );
}

function CameraStep({
  step,
  target,
  objectCount,
  onPass,
  onWrong,
  onTimeout,
}: {
  step: number;
  target: Target | null;
  objectCount: number;
  onPass: (remaining: number, spent: number) => void;
  onWrong: () => void;
  onTimeout: (spent: number) => void;
}) {
  const limit = LEVEL3_ITEM_LIMITS[step];
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(false);
  const [holding, setHolding] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const kind = useRef<CreatureKind>(CREATURES[Math.floor(Math.random() * CREATURES.length)]).current;
  const side = useRef<'left' | 'right'>(Math.random() < 0.5 ? 'left' : 'right').current;
  const lurkerSeen = useRef(false);
  const pending = useRef({ remaining: 0, elapsed: 0 });
  const onPassRef = useRef(onPass);
  onPassRef.current = onPass;
  const { scare, playGhost } = useJumpscare();
  const isSelfie = target === null;
  const t = useCountdown(limit, { paused: !ready || checking || holding, onExpire: () => onTimeout(limit) });

  useEffect(() => {
    if (!revealed) return;
    const { remaining, elapsed } = pending.current;
    const id = setTimeout(() => onPassRef.current(remaining, elapsed), 2000);
    return () => clearTimeout(id);
  }, [revealed]);

  const snap = async () => {
    if (!camera.current || !ready || checking || holding) return;
    const remaining = t.remaining;
    const elapsed = t.elapsed;
    setChecking(true);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.5, shutterSound: false });
      if (!photo?.uri) throw new Error('no photo');
      if (isSelfie) {
        pending.current = { remaining, elapsed };
        setHolding(true);
        setRevealed(photo.uri);
        setChecking(false);
        return;
      }
      const ctx = ImageManipulator.manipulate(photo.uri);
      ctx.resize({ width: 512 });
      const small = await (await ctx.renderAsync()).saveAsync({ format: SaveFormat.JPEG, compress: 0.6, base64: true });
      const result = await checkPhoto(small.base64 ?? '', target.gemma);
      if (result.match) return onPass(remaining, elapsed);
      scare('GET OUT');
      onWrong();
      return;
    } catch {
      setComment('The camera blinked. Try again.');
    }
    setChecking(false);
  };

  const label = isSelfie ? 'Selfie' : `${target.label} · ${step + 1} of ${objectCount}`;
  const heading = revealed ? 'It was behind you.' : isSelfie ? 'Now show me your face.' : target.title;

  return (
    <View style={styles.wrap}>
      <TimerBar remaining={t.remaining} limit={limit} label={`Level 3 · Stone Hall · ${label}`} paused={checking || holding} />
      <Text style={ui.heading}>{heading}</Text>
      {!revealed && <Text style={ui.dim}>{isSelfie ? 'Hold still.' : 'Fill the frame with it.'}</Text>}
      <View style={styles.cameraBox}>
        {revealed ? (
          <>
            <Image source={{ uri: revealed }} style={StyleSheet.absoluteFill} resizeMode="cover" fadeDuration={0} />
            <Lurker kind={kind} side={side} big immediate quiet={lurkerSeen.current} playGhost={playGhost} />
            <ShutterFlash />
          </>
        ) : (
          <>
            <CameraView
              ref={camera}
              style={StyleSheet.absoluteFill}
              facing={isSelfie ? 'front' : 'back'}
              mirror={isSelfie}
              onCameraReady={() => setReady(true)}
            />
            {isSelfie && (
              <Lurker
                kind={kind}
                side={side}
                playGhost={playGhost}
                onShown={() => {
                  lurkerSeen.current = true;
                }}
              />
            )}
            {checking && !isSelfie && (
              <View style={styles.overlay}>
                <Loader text="The spirit inspects the photo..." />
              </View>
            )}
          </>
        )}
      </View>
      {!!comment && !checking && <Text style={[ui.body, { color: colors.bloodBright, marginTop: 8 }]}>{comment}</Text>}
      {!revealed && (
        <Pressable style={[ui.button, (!ready || checking) && { opacity: 0.4 }]} onPress={snap} disabled={!ready || checking}>
          <Text style={ui.buttonText}>{isSelfie ? 'TAKE SELFIE' : 'SNAP'}</Text>
        </Pressable>
      )}
    </View>
  );
}

function ShutterFlash() {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 0, duration: 320, useNativeDriver: true }).start();
  }, [opacity]);
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, { opacity }]} />;
}

// Appears in a corner of the selfie so it reads as something standing behind the player.
function Lurker({
  kind,
  side,
  playGhost,
  onShown,
  big,
  immediate,
  quiet,
}: {
  kind: CreatureKind;
  side: 'left' | 'right';
  playGhost: () => void;
  onShown?: () => void;
  big?: boolean;
  immediate?: boolean;
  quiet?: boolean;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1.5)).current;
  const red = useRef(new Animated.Value(0)).current;
  const playRef = useRef(playGhost);
  const shownRef = useRef(onShown);
  playRef.current = playGhost;
  shownRef.current = onShown;

  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;
    const delay = immediate ? 60 : 2500 + Math.random() * 4000;
    const id = setTimeout(() => {
      shownRef.current?.();
      if (!quiet) playRef.current();
      anim = Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.spring(scale, { toValue: big ? 1.08 : 1, friction: 5, tension: 120, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(red, { toValue: 0.55, duration: 40, useNativeDriver: true }),
          Animated.timing(red, { toValue: 0, duration: 320, useNativeDriver: true }),
        ]),
      ]);
      anim.start();
    }, delay);
    return () => {
      clearTimeout(id);
      anim?.stop();
    };
  }, [big, immediate, opacity, quiet, red, scale]);

  const lean = side === 'left' ? '12deg' : '-12deg';
  const edge = side === 'left' ? { left: big ? 6 : -12 } : { right: big ? 6 : -12 };
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.redFlash, { opacity: red }]} />
      <Animated.View style={[styles.figure, edge, { opacity, transform: [{ scale }, { rotate: lean }] }]}>
        <View style={styles.shadow} />
        {kind === 'skeleton' && <Skeleton />}
        {kind === 'ghost' && <Ghost />}
        {kind === 'doll' && <Doll />}
      </Animated.View>
    </View>
  );
}

function Skeleton() {
  return (
    <View style={styles.skel}>
      <View style={styles.skull}>
        <View style={styles.socketRow}>
          <View style={styles.socket} />
          <View style={styles.socket} />
        </View>
        <View style={styles.nasal} />
        <View style={styles.teethRow}>
          {Array.from({ length: 6 }, (_, i) => (
            <View key={i} style={styles.tooth} />
          ))}
        </View>
      </View>
      <View style={styles.spine} />
      {[78, 96, 84, 64].map((width, i) => (
        <View key={i} style={[styles.rib, { width }]} />
      ))}
    </View>
  );
}

function Ghost() {
  return (
    <View style={styles.ghost}>
      <View style={styles.ghostEyes}>
        <View style={styles.ghostEye} />
        <View style={styles.ghostEye} />
      </View>
      <View style={styles.ghostMouth} />
      <View style={styles.ghostHem}>
        <View style={styles.ghostWave} />
        <View style={styles.ghostWave} />
        <View style={styles.ghostWave} />
      </View>
    </View>
  );
}

function Doll() {
  return (
    <View style={styles.doll}>
      <View style={styles.hair} />
      <View style={styles.face}>
        <View style={styles.dollEyes}>
          <View style={[styles.dollEye, { marginTop: 7 }]} />
          <View style={styles.dollEye} />
        </View>
        <View style={styles.dollSmile} />
      </View>
      <View style={styles.dress} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  cameraBox: { flex: 1, marginVertical: 12, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.blood, backgroundColor: '#000' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center' },
  hall: { flex: 1, marginHorizontal: -20, marginTop: -64, marginBottom: -20, backgroundColor: '#070605', overflow: 'hidden' },
  wallLeft: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '18%', backgroundColor: '#100e0c' },
  wallRight: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '18%', backgroundColor: '#100e0c' },
  door: {
    position: 'absolute', top: '50%', left: '50%', width: 74, height: 96, marginLeft: -37, marginTop: -78,
    backgroundColor: '#140806', borderWidth: 1, borderColor: '#5a2018', alignItems: 'center', justifyContent: 'center',
  },
  farSkull: { width: 64, height: 64, opacity: 0.7 },
  frame: {
    position: 'absolute', top: '50%', left: '50%', width: 230, height: 320, marginLeft: -115, marginTop: -180, borderWidth: 18,
  },
  stair: {
    position: 'absolute', top: '56%', left: '50%', width: 210, height: 12, marginLeft: -105,
    backgroundColor: '#3a322c', borderTopWidth: 2, borderTopColor: '#6a5b4e',
  },
  torch: {
    position: 'absolute', top: '31%', width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255, 90, 20, 0.38)', alignItems: 'center', justifyContent: 'center',
  },
  torchLeft: { left: '11%' },
  torchRight: { right: '11%' },
  flame: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ffb347' },
  vignette: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderWidth: 34, borderColor: 'rgba(0,0,0,0.72)' },
  wash: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000' },
  hallTop: { position: 'absolute', top: 78, left: 0, right: 0, alignItems: 'center', zIndex: 6 },
  eyebrow: { color: colors.blood, letterSpacing: 4, fontWeight: '800', fontSize: 13 },
  hallText: {
    position: 'absolute', left: 32, right: 32, bottom: 78, zIndex: 6,
    color: '#e6dcd2', fontSize: 22, fontWeight: '700', textAlign: 'center', lineHeight: 30,
  },
  flash: { backgroundColor: '#fff', zIndex: 4 },
  redFlash: { backgroundColor: 'rgba(160, 0, 0, 0.9)' },
  figure: { position: 'absolute', top: '18%', width: 150, alignItems: 'center' },
  shadow: { position: 'absolute', bottom: 6, width: 100, height: 18, borderRadius: 40, backgroundColor: 'rgba(0,0,0,0.45)' },
  skel: { alignItems: 'center' },
  skull: { width: 92, height: 100, borderRadius: 46, backgroundColor: '#e7e1d6', alignItems: 'center', paddingTop: 24 },
  socketRow: { flexDirection: 'row' },
  socket: { width: 22, height: 26, borderRadius: 11, backgroundColor: '#141210', marginHorizontal: 8 },
  nasal: { width: 10, height: 8, borderRadius: 4, backgroundColor: '#2a2622', marginTop: 6 },
  teethRow: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 2, padding: 2, marginTop: 6 },
  tooth: { width: 6, height: 8, backgroundColor: '#efe8dc', marginHorizontal: 1 },
  spine: { width: 8, height: 14, backgroundColor: '#e6e0d4' },
  rib: { height: 7, borderRadius: 4, backgroundColor: '#e6e0d4', marginTop: 4 },
  ghost: {
    width: 120, height: 168, backgroundColor: 'rgba(244,244,248,0.94)',
    borderTopLeftRadius: 60, borderTopRightRadius: 60, alignItems: 'center', paddingTop: 46,
  },
  ghostEyes: { flexDirection: 'row' },
  ghostEye: { width: 16, height: 24, borderRadius: 8, backgroundColor: '#161616', marginHorizontal: 12 },
  ghostMouth: { width: 28, height: 34, borderRadius: 14, backgroundColor: '#161616', marginTop: 12 },
  ghostHem: { position: 'absolute', bottom: -12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-evenly' },
  ghostWave: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(244,244,248,0.94)' },
  doll: { alignItems: 'center', paddingTop: 18 },
  hair: { position: 'absolute', top: 10, width: 84, height: 52, borderTopLeftRadius: 42, borderTopRightRadius: 42, backgroundColor: '#140e0c' },
  face: { width: 72, height: 84, borderRadius: 36, backgroundColor: '#f0cbb8', alignItems: 'center', paddingTop: 26 },
  dollEyes: { flexDirection: 'row' },
  dollEye: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#1a1a1a', marginHorizontal: 8 },
  dollSmile: {
    width: 34, height: 14, marginTop: 8, borderBottomWidth: 3, borderColor: '#7a1020',
    borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
  },
  dress: { width: 78, height: 52, backgroundColor: '#4a1020', marginTop: -4 },
});
