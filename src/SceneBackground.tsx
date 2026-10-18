import { ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, ImageBackground, ImageSourcePropType, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { Bg } from './story';

const DOOR = require('../assets/story/door.png');
const DOOR_SKULL = require('../assets/story/door-skull.png');
const NIGHT = require('../assets/story/night.png');
const BRICK = require('../assets/images/cellar-wall.jpg');

// Draws `source` covering the screen, then zooms and slides so the point (focusX, focusY), as a
// fraction of the image, sits in the middle. One wide picture gives many different views.
function Crop({ source, focusX, focusY, zoom = 1 }: { source: ImageSourcePropType; focusX: number; focusY: number; zoom?: number }) {
  const { width: W, height: H } = useWindowDimensions();
  const { width: iw, height: ih } = Image.resolveAssetSource(source);
  const scale = Math.max(W / iw, H / ih) * zoom;
  const w = iw * scale;
  const h = ih * scale;
  const left = Math.min(0, Math.max(W - w, W / 2 - focusX * w));
  const top = Math.min(0, Math.max(H - h, H / 2 - focusY * h));
  return <Image source={source} style={{ position: 'absolute', left, top, width: w, height: h }} />;
}

const Brick = ({ shade }: { shade: number }) => (
  <ImageBackground source={BRICK} resizeMode="repeat" style={StyleSheet.absoluteFill}>
    <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(14,0,0,${shade})` }]} />
  </ImageBackground>
);

// Iron bars over the night sky, so it reads as a high cellar window.
function Window() {
  return (
    <>
      <Crop source={NIGHT} focusX={0.84} focusY={0.28} zoom={1.15} />
      <View style={[StyleSheet.absoluteFill, styles.bars]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.bar} />
        ))}
      </View>
      <View style={[StyleSheet.absoluteFill, styles.windowFrame]} />
    </>
  );
}

// Warm light spilling through the opened door.
function DoorLight() {
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(glow, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [glow]);
  return (
    <>
      <Crop source={DOOR} focusX={0.5} focusY={0.45} />
      <Animated.View style={[StyleSheet.absoluteFill, styles.warm, { opacity: glow }]} />
      <Animated.View style={[styles.shaft, { opacity: glow }]} />
    </>
  );
}

const LAYERS: Record<Bg, () => ReactNode> = {
  cellar: () => <Brick shade={0.55} />,
  dark: () => <Brick shade={0.95} />,
  door: () => <Crop source={DOOR} focusX={0.5} focusY={0.45} />,
  doorSkull: () => <Crop source={DOOR_SKULL} focusX={0.5} focusY={0.45} />,
  skullClose: () => <Crop source={DOOR_SKULL} focusX={0.5} focusY={0.1} zoom={2.3} />,
  floor: () => <Crop source={DOOR} focusX={0.5} focusY={0.97} zoom={1.8} />,
  window: () => <Window />,
  doorLight: () => <DoorLight />,
};

// The scene's backdrop. When the name changes the new picture fades in over the old one, and the
// whole thing drifts slowly (a gentle zoom) so even still art feels alive.
export default function SceneBackground({ name }: { name: Bg }) {
  const [current, setCurrent] = useState(name);
  const [previous, setPrevious] = useState<Bg | null>(null);
  const fade = useRef(new Animated.Value(1)).current;
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (name === current) return;
    setPrevious(current);
    setCurrent(name);
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }).start(() => setPrevious(null));
  }, [name]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift]);

  const scale = drift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000', transform: [{ scale }] }]}>
      {previous && <View style={StyleSheet.absoluteFill}>{LAYERS[previous]()}</View>}
      <Animated.View key={current} style={[StyleSheet.absoluteFill, { opacity: fade }]}>
        {LAYERS[current]()}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bars: { flexDirection: 'row', justifyContent: 'space-evenly', paddingHorizontal: 18 },
  bar: { width: 9, height: '100%', backgroundColor: 'rgba(10,10,12,0.92)' },
  windowFrame: { borderColor: 'rgba(0,0,0,0.9)', borderWidth: 26 },
  warm: { backgroundColor: 'rgba(255,196,110,0.22)' },
  shaft: { position: 'absolute', top: '8%', left: '28%', width: '44%', height: '42%', backgroundColor: 'rgba(255,226,160,0.28)' },
});
