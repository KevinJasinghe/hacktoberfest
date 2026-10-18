import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { checkPhoto, pickObjects } from './gemma';
import { LevelProps } from './levels';
import Loader from './Loader';
import { LEVEL3_ITEM_LIMITS } from './scoring';
import TimerBar from './TimerBar';
import { colors, ui } from './theme';
import { useCountdown } from './useCountdown';

// GameScreen keeps the objects so a timeout reset reuses the same two.
type Props = LevelProps & { objectsRef: MutableRefObject<string[] | null> };

// Level 3: photograph 2 objects (1:00 each), then take a selfie (0:30). Level points use the summed time left.
export default function Level3({ onClear, onTimeout, objectsRef }: Props) {
  const [objects, setObjects] = useState(objectsRef.current);
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState(0);
  const left = useRef(0);
  const spent = useRef(0);

  useEffect(() => {
    if (objects) return;
    pickObjects().then((o) => {
      objectsRef.current = o;
      setObjects(o);
    });
  }, []);

  if (!permission) return <Loader text="Something stirs in the attic..." />;
  if (!permission.granted) {
    return (
      <View style={ui.center}>
        <Text style={[ui.body, { textAlign: 'center' }]}>The attic is pitch black. Let the spirit see through your camera.</Text>
        <Pressable style={ui.button} onPress={requestPermission}>
          <Text style={ui.buttonText}>ALLOW CAMERA</Text>
        </Pressable>
      </View>
    );
  }
  if (!objects) return <Loader text="The spirit is choosing what you must find..." />;

  const clearStep = (remaining: number, stepSpent: number) => {
    left.current += remaining;
    spent.current += stepSpent;
    if (step + 1 < LEVEL3_ITEM_LIMITS.length) setStep(step + 1);
    else onClear(left.current, spent.current);
  };

  return (
    <CameraStep
      key={step}
      step={step}
      target={step < 2 ? objects[step] : null}
      onPass={clearStep}
      onTimeout={(stepSpent) => onTimeout(spent.current + stepSpent)}
    />
  );
}

function CameraStep({ step, target, onPass, onTimeout }: { step: number; target: string | null; onPass: (remaining: number, spent: number) => void; onTimeout: (spent: number) => void }) {
  const limit = LEVEL3_ITEM_LIMITS[step];
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(false);
  const [comment, setComment] = useState('');
  const t = useCountdown(limit, { paused: !ready || checking, onExpire: () => onTimeout(limit) });
  const isSelfie = target === null;

  const snap = async () => {
    if (!camera.current || !ready || checking) return;
    setChecking(true);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.5, shutterSound: false });
      if (isSelfie) return onPass(t.remaining, t.elapsed); // the selfie isn't checked or saved
      const ctx = ImageManipulator.manipulate(photo.uri);
      ctx.resize({ width: 512 });
      const small = await (await ctx.renderAsync()).saveAsync({ format: SaveFormat.JPEG, compress: 0.6, base64: true });
      const result = await checkPhoto(small.base64 ?? '', target);
      if (result.match) return onPass(t.remaining, t.elapsed);
      setComment(result.comment || `That is not a ${target}.`);
    } catch (e) {
      setComment('The camera blinked. Try again.');
    }
    setChecking(false);
  };

  const label = isSelfie ? 'Selfie' : `Object ${step + 1} of 2`;
  return (
    <View style={styles.wrap}>
      <TimerBar remaining={t.remaining} limit={limit} label={`Level 3 · The Attic · ${label}`} paused={checking} />
      <Text style={ui.heading}>{isSelfie ? 'Now show me your face.' : `Find a ${target}.`}</Text>
      <View style={styles.cameraBox}>
        <CameraView ref={camera} style={StyleSheet.absoluteFill} facing={isSelfie ? 'front' : 'back'} onCameraReady={() => setReady(true)} />
        {isSelfie && <SelfieScare />}
        {checking && !isSelfie && (
          <View style={styles.overlay}>
            <Loader text={`The spirit inspects your ${target}...`} />
          </View>
        )}
      </View>
      {!!comment && !checking && <Text style={[ui.body, { color: colors.bloodBright, marginTop: 8 }]}>{comment}</Text>}
      <Pressable style={[ui.button, (!ready || checking) && { opacity: 0.4 }]} onPress={snap} disabled={!ready || checking}>
        <Text style={ui.buttonText}>{isSelfie ? 'TAKE SELFIE' : 'SNAP'}</Text>
      </Pressable>
    </View>
  );
}

// Something appears behind the player at a random moment on the selfie camera.
function SelfieScare() {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const delay = 3000 + Math.random() * 9000;
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.delay(900),
      Animated.timing(opacity, { toValue: 0.25, duration: 1500, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View pointerEvents="none" style={[styles.scare, { opacity }]}>
      <Text style={styles.scareFace}>💀</Text>
      <Text style={styles.scareText}>BEHIND YOU</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  cameraBox: { flex: 1, marginVertical: 12, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.blood, backgroundColor: '#000' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center' },
  scare: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(120,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  scareFace: { fontSize: 180 },
  scareText: { color: colors.bloodBright, fontSize: 36, fontWeight: '900', letterSpacing: 4 },
});
