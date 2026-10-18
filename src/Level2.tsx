import { Canvas, Fill, ImageFormat, Path, Skia, SkPath, useCanvasRef } from '@shopify/react-native-skia';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { drawingPrompt, scoreDrawing } from './gemma';
import { useJumpscare } from './Jumpscare';
import { LevelProps } from './levels';
import Loader from './Loader';
import { LEVEL_LIMITS } from './scoring';
import TimerBar from './TimerBar';
import { colors, ui } from './theme';
import { useCountdown } from './useCountdown';

const LIMIT = LEVEL_LIMITS[2];
const PASS_SCORE = 75;
const BG = 'black';
const PALETTE = ['#ffffff', '#ff3b30', '#ff9500', '#ffd60a', '#34c759', '#0a84ff', '#bf5af2'];
const PEN_WIDTH = 6;
const ERASER_WIDTH = 28;

type Stroke = { path: SkPath; color: string; width: number };

// Level 2: draw Gemma's prompt; a score above 75 clears the level, anything else means redraw.
export default function Level2({ onClear, onTimeout }: LevelProps) {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [scoring, setScoring] = useState(false);
  // Set when the drawing passes: the level waits (timer paused) until the player taps NEXT LEVEL.
  const [passed, setPassed] = useState<{ remaining: number; elapsed: number } | null>(null);
  const [verdict, setVerdict] = useState<{ score: number; comment: string } | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [color, setColor] = useState(PALETTE[0]);
  const [erasing, setErasing] = useState(false);
  const drawing = useRef(false);
  const canvasRef = useCanvasRef();
  const { scare } = useJumpscare();

  const t = useCountdown(LIMIT, { paused: !prompt || scoring || !!passed, onExpire: () => onTimeout(LIMIT) });

  useEffect(() => {
    drawingPrompt().then(setPrompt);
  }, []);

  // One guaranteed surprise jumpscare at a random moment while the player is drawing.
  const scareRef = useRef(scare);
  scareRef.current = scare;
  useEffect(() => {
    if (!prompt) return;
    const id = setTimeout(() => scareRef.current(), (4 + Math.random() * 18) * 1000);
    return () => clearTimeout(id);
  }, [prompt]);

  const start = (x: number, y: number) => {
    const p = Skia.Path.Make();
    p.moveTo(x, y);
    p.lineTo(x + 0.1, y + 0.1); // so a single tap leaves a dot
    drawing.current = true;
    // The eraser paints in the canvas colour, so it also works in the image sent to Gemma.
    const stroke = erasing ? { path: p, color: BG, width: ERASER_WIDTH } : { path: p, color, width: PEN_WIDTH };
    setStrokes((s) => [...s, stroke]);
  };
  // Replace the last stroke with an extended copy so Skia sees a new path and redraws.
  const move = (x: number, y: number) => {
    if (!drawing.current) return;
    setStrokes((s) => {
      if (!s.length) return s;
      const last = s[s.length - 1];
      return [...s.slice(0, -1), { ...last, path: last.path.copy().lineTo(x, y) }];
    });
  };

  const clear = () => {
    setStrokes([]);
    drawing.current = false;
  };

  const submit = async () => {
    if (!prompt || !strokes.length || scoring || !!passed) return;
    const image = canvasRef.current?.makeImageSnapshot();
    const base64 = image?.encodeToBase64(ImageFormat.JPEG, 70);
    if (!base64) return;
    setScoring(true);
    const result = await scoreDrawing(base64, prompt);
    setScoring(false);
    setVerdict(result);
    if (result.score > PASS_SCORE) {
      setPassed({ remaining: t.remaining, elapsed: t.elapsed });
    } else {
      scare();
      clear();
    }
  };

  if (!prompt) return <Loader text="The spirit is deciding what you must draw..." />;

  return (
    <View>
      <TimerBar remaining={t.remaining} limit={LIMIT} label="Level 2 · The Nursery" paused={scoring} />
      <Text style={ui.dim}>Draw this, or stay here forever:</Text>
      <Text style={[ui.heading, { marginTop: 4 }]}>{prompt}</Text>

      <View
        style={styles.pad}
        onStartShouldSetResponder={() => !scoring && !passed}
        onMoveShouldSetResponder={() => !scoring && !passed}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(e) => start(e.nativeEvent.locationX, e.nativeEvent.locationY)}
        onResponderMove={(e) => move(e.nativeEvent.locationX, e.nativeEvent.locationY)}
        onResponderRelease={() => (drawing.current = false)}
      >
        <Canvas ref={canvasRef} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Fill color={BG} />
          {strokes.map((st, i) => (
            <Path key={i} path={st.path} style="stroke" strokeWidth={st.width} strokeCap="round" strokeJoin="round" color={st.color} />
          ))}
        </Canvas>
        {scoring && (
          <View style={styles.overlay}>
            <Loader text="The spirit judges your work..." />
          </View>
        )}
      </View>

      {verdict && !scoring && (
        <Text style={[ui.body, { color: verdict.score > PASS_SCORE ? colors.text : colors.bloodBright, marginTop: 8 }]}>
          {verdict.score}/100 · {verdict.comment}
        </Text>
      )}

      <View style={styles.tools}>
        {PALETTE.map((c) => (
          <Pressable
            key={c}
            onPress={() => {
              setColor(c);
              setErasing(false);
            }}
            disabled={scoring}
            style={[styles.swatch, { backgroundColor: c }, !erasing && color === c && styles.swatchOn]}
          />
        ))}
        <Pressable onPress={() => setErasing(true)} disabled={scoring} style={[styles.eraser, erasing && styles.swatchOn]}>
          <Text style={styles.eraserText}>ERASER</Text>
        </Pressable>
      </View>

      {passed ? (
        <Pressable style={ui.button} onPress={() => onClear(passed.remaining, passed.elapsed)}>
          <Text style={ui.buttonText}>NEXT LEVEL ▶</Text>
        </Pressable>
      ) : (
      <View style={styles.row}>
        <Pressable style={[ui.buttonGhost, styles.flex]} onPress={clear} disabled={scoring || !!passed}>
          <Text style={ui.buttonText}>CLEAR</Text>
        </Pressable>
        <Pressable style={[ui.button, styles.flex, !strokes.length && { opacity: 0.4 }]} onPress={submit} disabled={scoring || !!passed || !strokes.length}>
          <Text style={ui.buttonText}>SUBMIT</Text>
        </Pressable>
      </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { width: '100%', aspectRatio: 1, marginTop: 12, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.blood },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center' },
  tools: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: colors.panel },
  swatchOn: { borderColor: colors.bloodBright, transform: [{ scale: 1.15 }] },
  eraser: { paddingHorizontal: 10, height: 32, borderRadius: 16, borderWidth: 2, borderColor: colors.dim, justifyContent: 'center' },
  eraserText: { color: colors.text, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
});
