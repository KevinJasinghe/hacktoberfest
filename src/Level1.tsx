import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { isCorrect } from './answers';
import ClosingWalls from './ClosingWalls';
import { Cellar, generatePuzzles } from './gemma';
import * as haptics from './haptics';
import { useJumpscare } from './Jumpscare';
import { LevelProps } from './levels';
import Loader from './Loader';
import NumberPad from './NumberPad';
import { LEVEL_LIMITS } from './scoring';
import { generateSudoku } from './sudoku';
import SudokuBoard from './SudokuBoard';
import TimerBar from './TimerBar';
import { colors, ui } from './theme';
import Typewriter from './Typewriter';
import { useCountdown } from './useCountdown';

const LIMIT = LEVEL_LIMITS[1];
const HINT_COST = 15; // seconds burned per hint
const LOCK_NAMES = ['The Riddle', 'The Sum', 'The Grid'];

// Level 1: a door with three locks. Lock 1 is a riddle, lock 2 a math puzzle, lock 3 a 4x4 sudoku.
// A reset (timeout) remounts this level, which brings new puzzles and a new sudoku.
export default function Level1({ onClear, onTimeout }: LevelProps) {
  const [cellar, setCellar] = useState<Cellar | null>(null);
  const sudoku = useMemo(() => generateSudoku(), []);
  const [lock, setLock] = useState(0); // index of the lock being worked on
  const [guess, setGuess] = useState('');
  const [spirit, setSpirit] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [hintSignal, setHintSignal] = useState(0);
  const shake = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const { playGhost } = useJumpscare();
  const t = useCountdown(LIMIT, { paused: !cellar, onExpire: () => onTimeout(LIMIT) });

  useEffect(() => {
    generatePuzzles().then((c) => {
      setCellar(c);
      setSpirit(c.lines.intro);
    });
  }, []);

  // Heartbeat buzz once a second while the clock is nearly out.
  const secondsLeft = Math.ceil(t.remaining);
  useEffect(() => {
    if (cellar && secondsLeft > 0 && secondsLeft <= 10) haptics.heartbeat();
  }, [secondsLeft, cellar]);

  if (!cellar) return <Loader text="The spirit is bolting three locks onto the cellar door..." />;
  const puzzle = lock < 2 ? cellar.puzzles[lock] : null;
  const canHint = t.remaining > HINT_COST && (lock === 2 || !hint);

  const openLock = (skipped = false) => {
    if (!skipped) {
      playGhost();
      haptics.lockOpen();
    }
    setGuess('');
    setHint(null);
    if (lock < 2) {
      setLock(lock + 1);
      setSpirit(skipped ? cellar.lines.intro : cellar.lines.solved);
    } else onClear(t.remaining, t.elapsed);
  };

  const wrongAnswer = () => {
    haptics.wrong();
    setSpirit(cellar.lines.wrong);
    Animated.sequence(
      [12, -12, 8, -8, 0].map((toValue) => Animated.timing(shake, { toValue, duration: 50, useNativeDriver: true })),
    ).start();
    flash.setValue(0.5);
    Animated.timing(flash, { toValue: 0, duration: 400, useNativeDriver: true }).start();
  };

  const submit = () => {
    if (!puzzle || !guess.trim()) return;
    if (isCorrect(guess, puzzle.answers)) openLock();
    else wrongAnswer();
  };

  const useHint = () => {
    if (!canHint) return;
    haptics.warn();
    t.penalize(HINT_COST);
    if (puzzle) setHint(puzzle.hint);
    else setHintSignal(hintSignal + 1);
  };

  const onPadKey = (key: string) => {
    if (key === '↵') submit();
    else if (key === '⌫') setGuess(guess.slice(0, -1));
    else setGuess((guess + key).slice(0, 6));
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <TimerBar remaining={t.remaining} limit={LIMIT} label={`Level 1 · The Cellar · ${LOCK_NAMES[lock]}`} />
      <View style={styles.locks}>
        {LOCK_NAMES.map((name, i) => (
          <Text key={name} style={[styles.lock, i === lock && styles.lockActive]}>
            {i < lock ? '🔓' : '🔒'}
          </Text>
        ))}
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
        {spirit && <Typewriter text={spirit} style={styles.spirit} />}
        {puzzle ? (
          <>
            <Text style={[ui.heading, styles.question]}>{puzzle.question}</Text>
            <Animated.View style={{ transform: [{ translateX: shake }] }}>
              {puzzle.type === 'math' ? (
                <Text style={styles.display}>{guess || ' '}</Text>
              ) : (
                <TextInput
                  style={styles.input}
                  value={guess}
                  onChangeText={setGuess}
                  onSubmitEditing={submit}
                  placeholder="Your answer..."
                  placeholderTextColor={colors.dim}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  autoFocus
                />
              )}
            </Animated.View>
            {hint && <Text style={styles.hint}>Hint: {hint}</Text>}
            {puzzle.type === 'math' ? (
              <View style={{ marginTop: 16 }}>
                <NumberPad onKey={onPadKey} />
              </View>
            ) : (
              <Pressable style={ui.button} onPress={submit}>
                <Text style={ui.buttonText}>ANSWER</Text>
              </Pressable>
            )}
          </>
        ) : (
          <View style={{ marginTop: 16 }}>
            <SudokuBoard sudoku={sudoku} onSolved={() => openLock()} hintSignal={hintSignal} />
          </View>
        )}
        <Pressable style={[ui.buttonGhost, !canHint && { opacity: 0.35 }]} onPress={useHint} disabled={!canHint}>
          <Text style={[ui.buttonText, { color: colors.dim }]}>
            {lock === 2 ? 'REVEAL A CELL' : 'HINT'} (-{HINT_COST}s)
          </Text>
        </Pressable>
        <Pressable style={styles.skip} onPress={() => openLock(true)}>
          <Text style={styles.skipText}>SKIP PUZZLE (dev)</Text>
        </Pressable>
      </ScrollView>
      <Animated.View pointerEvents="none" style={[styles.flash, { opacity: flash }]} />
      <ClosingWalls remaining={t.remaining} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  locks: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 8 },
  lock: { fontSize: 30, opacity: 0.5 },
  lockActive: { opacity: 1 },
  spirit: { color: colors.bloodBright, fontStyle: 'italic', fontSize: 16, lineHeight: 22, minHeight: 48 },
  question: { marginTop: 12, marginBottom: 20, fontSize: 24, lineHeight: 32 },
  input: { borderWidth: 1, borderColor: colors.blood, borderRadius: 8, color: colors.text, fontSize: 20, padding: 14, backgroundColor: colors.panel },
  display: { borderWidth: 1, borderColor: colors.blood, borderRadius: 8, color: colors.text, fontSize: 32, fontWeight: '800', padding: 12, backgroundColor: colors.panel, textAlign: 'center' },
  skip: { marginTop: 16, alignItems: 'center', padding: 8 },
  skipText: { color: colors.dim, fontSize: 13, letterSpacing: 1, textDecorationLine: 'underline' },
  hint: { color: colors.dim, fontStyle: 'italic', marginTop: 10 },
  flash: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bloodBright, zIndex: 5 },
});
