import { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { isCorrect } from './answers';
import { generatePuzzles, Puzzle } from './gemma';
import { LevelProps } from './levels';
import Loader from './Loader';
import { LEVEL_LIMITS } from './scoring';
import TimerBar from './TimerBar';
import { colors, ui } from './theme';
import { useCountdown } from './useCountdown';

const LIMIT = LEVEL_LIMITS[1];
const PUZZLE_COUNT = 3;

// Level 1: solve all of Gemma's puzzles before the timer runs out. A reset brings new puzzles.
export default function Level1({ onClear, onTimeout }: LevelProps) {
  const [puzzles, setPuzzles] = useState<Puzzle[] | null>(null);
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState('');
  const [wrong, setWrong] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;
  const t = useCountdown(LIMIT, { paused: !puzzles, onExpire: () => onTimeout(LIMIT) });

  useEffect(() => {
    generatePuzzles(PUZZLE_COUNT).then(setPuzzles);
  }, []);

  if (!puzzles) return <Loader text="The spirit is carving riddles into the walls..." />;
  const puzzle = puzzles[index];

  const submit = () => {
    if (!guess.trim()) return;
    if (isCorrect(guess, puzzle.answers)) {
      setGuess('');
      setWrong(false);
      if (index + 1 < puzzles.length) setIndex(index + 1);
      else onClear(t.remaining, t.elapsed);
      return;
    }
    setWrong(true);
    Animated.sequence(
      [12, -12, 8, -8, 0].map((toValue) => Animated.timing(shake, { toValue, duration: 50, useNativeDriver: true })),
    ).start();
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <TimerBar remaining={t.remaining} limit={LIMIT} label="Level 1 · The Cellar" />
      <Text style={ui.dim}>
        Riddle {index + 1} of {puzzles.length} · {puzzle.type === 'math' ? 'count carefully' : 'think'}
      </Text>
      <Text style={[ui.heading, styles.question]}>{puzzle.question}</Text>
      <Animated.View style={{ transform: [{ translateX: shake }] }}>
        <TextInput
          style={[styles.input, wrong && { borderColor: colors.bloodBright }]}
          value={guess}
          onChangeText={(s) => {
            setGuess(s);
            setWrong(false);
          }}
          onSubmitEditing={submit}
          placeholder="Your answer..."
          placeholderTextColor={colors.dim}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          keyboardType={puzzle.type === 'math' ? 'numbers-and-punctuation' : 'default'}
          autoFocus
        />
      </Animated.View>
      {wrong && <Text style={[ui.body, { color: colors.bloodBright, marginTop: 8 }]}>Wrong. The walls draw closer.</Text>}
      <Pressable style={ui.button} onPress={submit}>
        <Text style={ui.buttonText}>ANSWER</Text>
      </Pressable>
      <View style={{ flex: 1 }} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  question: { marginTop: 12, marginBottom: 20, fontSize: 24, lineHeight: 32 },
  input: { borderWidth: 1, borderColor: colors.blood, borderRadius: 8, color: colors.text, fontSize: 20, padding: 14, backgroundColor: colors.panel },
});
