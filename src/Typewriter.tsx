import { useEffect, useState } from 'react';
import { Pressable, StyleProp, Text, TextStyle } from 'react-native';

const CHAR_MS = 28;

// Reveals `text` one character at a time; tap to show it all.
export default function Typewriter({ text, style }: { text: string; style?: StyleProp<TextStyle> }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    setShown(0);
    const id = setInterval(() => {
      setShown((n) => {
        if (n >= text.length) clearInterval(id);
        return Math.min(n + 1, text.length);
      });
    }, CHAR_MS);
    return () => clearInterval(id);
  }, [text]);

  return (
    <Pressable onPress={() => setShown(text.length)}>
      <Text style={style}>{text.slice(0, shown)}</Text>
    </Pressable>
  );
}
