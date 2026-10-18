import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleProp, Text, TextStyle } from 'react-native';

const CHAR_MS = 28;

type Props = {
  text: string;
  style?: StyleProp<TextStyle>;
  onComplete?: () => void; // fires once the whole line is showing
  skipToken?: number; // bump it to reveal the whole line from outside
};

// Reveals `text` one character at a time; tap to show it all. Give it a `key` per line when using
// onComplete/skipToken so each line starts from a clean state.
export default function Typewriter({ text, style, onComplete, skipToken }: Props) {
  const [shown, setShown] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

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

  useEffect(() => {
    if (skipToken) setShown(text.length);
  }, [skipToken]);

  useEffect(() => {
    if (shown >= text.length) onCompleteRef.current?.();
  }, [shown, text]);

  return (
    <Pressable onPress={() => setShown(text.length)}>
      <Text style={style}>{text.slice(0, shown)}</Text>
    </Pressable>
  );
}
