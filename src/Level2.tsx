import { Canvas, Fill, ImageFormat, Path, Skia, SkPath, useCanvasRef } from '@shopify/react-native-skia';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { drawingPrompt, scoreDrawing } from './gemma';
import { LevelProps } from './levels';
import Loader from './Loader';
import { LEVEL_LIMITS } from './scoring';
import TimerBar from './TimerBar';
import { colors, ui } from './theme';
import { useCountdown } from './useCountdown';

const LIMIT = LEVEL_LIMITS[2];
const PASS_SCORE = 75;

// Level 2: draw Gemma's prompt; a score above 75 clears the level, anything else means redraw.
export default function Level2({ onClear, onTimeout }: LevelProps) {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [scoring, setScoring] = useState(false);
  const [verdict, setVerdict] = useState<{ score: number; comment: string } | null>(null);
  const [strokes, setStrokes] = useState<SkPath[]>([]);
  const drawing = useRef(false);
  const canvasRef = useCanvasRef();

  const t = useCountdown(LIMIT, { paused: !prompt || scoring, onExpire: () => onTimeout(LIMIT) });

  useEffect(() => {
    drawingPrompt().then(setPrompt);
  }, []);

  const start = (x: number, y: number) => {
    const p = Skia.Path.Make();
    p.moveTo(x, y);
    p.lineTo(x + 0.1, y + 0.1); // so a single tap leaves a dot
    drawing.current = true;
    setStrokes((s) => [...s, p]);
  };
  // Replace the last stroke with an extended copy so Skia sees a new path and redraws.
  const move = (x: number, y: number) => {
    if (!drawing.current) return;
    setStrokes((s) => (s.length ? [...s.slice(0, -1), s[s.length - 1].copy().lineTo(x, y)] : s));
  };

  const clear = () => {
    setStrokes([]);
    drawing.current = false;
  };

  const submit = async () => {
    if (!prompt || !strokes.length || scoring) return;
    const image = canvasRef.current?.makeImageSnapshot();
    const base64 = image?.encodeToBase64(ImageFormat.JPEG, 70);
    if (!base64) return;
    setScoring(true);
    const result = await scoreDrawing(base64, prompt);
    setScoring(false);
    setVerdict(result);
    if (result.score > PASS_SCORE) onClear(t.remaining, t.elapsed);
    else clear();
  };

  if (!prompt) return <Loader text="The spirit is deciding what you must draw..." />;

  return (
    <View>
      <TimerBar remaining={t.remaining} limit={LIMIT} label="Level 2 · The Nursery" paused={scoring} />
      <Text style={ui.dim}>Draw this, or stay here forever:</Text>
      <Text style={[ui.heading, { marginTop: 4 }]}>{prompt}</Text>

      <View
        style={styles.pad}
        onStartShouldSetResponder={() => !scoring}
        onMoveShouldSetResponder={() => !scoring}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(e) => start(e.nativeEvent.locationX, e.nativeEvent.locationY)}
        onResponderMove={(e) => move(e.nativeEvent.locationX, e.nativeEvent.locationY)}
        onResponderRelease={() => (drawing.current = false)}
      >
        <Canvas ref={canvasRef} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Fill color="black" />
          {strokes.map((p, i) => (
            <Path key={i} path={p} style="stroke" strokeWidth={6} strokeCap="round" strokeJoin="round" color="white" />
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

      <View style={styles.row}>
        <Pressable style={[ui.buttonGhost, styles.flex]} onPress={clear} disabled={scoring}>
          <Text style={ui.buttonText}>CLEAR</Text>
        </Pressable>
        <Pressable style={[ui.button, styles.flex, !strokes.length && { opacity: 0.4 }]} onPress={submit} disabled={scoring || !strokes.length}>
          <Text style={ui.buttonText}>SUBMIT</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { width: '100%', aspectRatio: 1, marginTop: 12, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.blood },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
});
