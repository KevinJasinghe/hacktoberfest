import { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { isCorrect } from './answers';
import { useAudio } from './audio';
import ClosingWalls from './ClosingWalls';
import { Cellar, generatePuzzles } from './gemma';
import * as haptics from './haptics';
import { hintsFor, MAX_HINTS } from './hints';
import { LevelProps } from './levels';
import Loader from './Loader';
import NumberPad from './NumberPad';
import { LEVEL1_LOCK_LIMIT } from './scoring';
import { STORY } from './story';
import StoryScene from './StoryScene';
import TimerBar from './TimerBar';
import { colors, SCREEN_BLEED, ui } from './theme';
import Typewriter from './Typewriter';
import { useCountdown } from './useCountdown';

const LIMIT = LEVEL1_LOCK_LIMIT; // each lock gets its own timer
const HINT_COST = 3; // seconds burned per hint; each puzzle has MAX_HINTS rungs (src/hints.ts)
const LOCK_NAMES = ['The Riddle', 'The Sum'];
const LAST_LOCK = LOCK_NAMES.length - 1;

// Level 1: a door with two locks. Lock 1 is a riddle and lock 2 a math puzzle, both written by Gemma.
// Each lock has its own 15s timer; running out on either one resets the level.
// A reset (timeout) remounts this level, which brings new puzzles.
export default function Level1({ onClear, onTimeout, attempt = 0 }: LevelProps) {
  const [cellar, setCellar] = useState<Cellar | null>(null);
  const [lock, setLock] = useState(0); // index of the lock being worked on
  const [guess, setGuess] = useState('');
  const [spirit, setSpirit] = useState<string | null>(null);
  const [hintCount, setHintCount] = useState(0); // hint rungs bought for the current puzzle
  // Story cutscenes pause the timer. The intro plays on the first try only, not after every timeout.
  const [scene, setScene] = useState<'intro' | 'lock0' | 'lock1' | null>(attempt === 0 ? 'intro' : null);
  const shake = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const { music, sfx } = useAudio();
  const banked = useRef({ left: 0, spent: 0 }); // time left and spent on the locks already opened
  const t = useCountdown(LIMIT, {
    paused: !cellar || !!scene,
    onExpire: () => onTimeout(banked.current.spent + LIMIT),
  });

  useEffect(() => {
    generatePuzzles().then((c) => {
      setCellar(c);
      setSpirit(attempt === 0 ? null : c.lines.intro);
    });
  }, []);

  // Story scenes get the dungeon track, puzzles get the tense one; leaving the level restores the main loop.
  useEffect(() => {
    music(scene ? 'dungeon' : 'tense');
  }, [scene]);
  useEffect(() => () => music('main'), []);

  // Heartbeat (buzz and sound) once a second while the clock is nearly out.
  const secondsLeft = Math.ceil(t.remaining);
  useEffect(() => {
    if (cellar && !scene && secondsLeft > 0 && secondsLeft <= 5) {
      haptics.heartbeat();
      sfx('heartbeat', 0.8);
    }
  }, [secondsLeft, cellar, scene]);

  if (!cellar) return <Loader text="The spirit is bolting two locks onto the cellar door..." />;
  const puzzle = cellar.puzzles[lock];
  const hints = hintsFor(puzzle).slice(0, hintCount);
  const canHint = t.remaining > HINT_COST && hintCount < MAX_HINTS;

  const openLock = () => {
    sfx('lockOpen');
    banked.current.left += t.remaining;
    banked.current.spent += t.elapsed;
    haptics.lockOpen();
    setGuess('');
    setHintCount(0);
    setSpirit(null);
    if (lock < LAST_LOCK) {
      setLock(lock + 1);
      t.reset(); // the next lock starts on a fresh timer (paused while its story scene plays)
    }
    setScene(lock === 0 ? 'lock0' : 'lock1'); // the last scene leads into Level 2 and then clears the level
  };

  const wrongAnswer = () => {
    haptics.wrong();
    sfx('wrong');
    setSpirit(cellar.lines.wrong);
    Animated.sequence(
      [12, -12, 8, -8, 0].map((toValue) => Animated.timing(shake, { toValue, duration: 50, useNativeDriver: true })),
    ).start();
    flash.setValue(0.5);
    Animated.timing(flash, { toValue: 0, duration: 400, useNativeDriver: true }).start();
  };

  const submit = () => {
    if (!guess.trim()) return;
    if (isCorrect(guess, puzzle.answers)) openLock();
    else wrongAnswer();
  };

  const useHint = () => {
    if (!canHint) return;
    haptics.warn();
    sfx('hint');
    t.penalize(HINT_COST);
    setHintCount(hintCount + 1);
  };

  const onPadKey = (key: string) => {
    if (key === '↵') submit();
    else if (key === '⌫') setGuess(guess.slice(0, -1));
    else setGuess((guess + key).slice(0, 6));
  };

  if (scene) {
    const beats = scene === 'intro' ? STORY.intro : STORY.afterLock[Number(scene.slice(-1))];
    // Time left and spent were banked as each lock opened, so the level reports the sum of both timers.
    const done = () => (scene === `lock${LAST_LOCK}` ? onClear(banked.current.left, banked.current.spent) : setScene(null));
    return (
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <StoryScene key={scene} beats={beats} onDone={done} />
      </KeyboardAvoidingView>
    );
  }

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
        {hints.length > 0 && (
          <View style={styles.hints}>
            {hints.map((h, i) => (
              <Text key={i} style={[styles.hint, h.includes('_') && styles.hintPattern]}>
                {i + 1}. {h}
              </Text>
            ))}
          </View>
        )}
        {puzzle.type === 'math' ? (
          <View style={{ marginTop: 16 }}>
            <NumberPad onKey={onPadKey} />
          </View>
        ) : (
          <Pressable style={ui.button} onPress={submit}>
            <Text style={ui.buttonText}>ANSWER</Text>
          </Pressable>
        )}
        <Pressable style={[ui.buttonGhost, !canHint && { opacity: 0.35 }]} onPress={useHint} disabled={!canHint}>
          <Text style={[ui.buttonText, { color: colors.dim }]}>
            {hintCount >= MAX_HINTS ? 'NO MORE HINTS' : `HINT ${hintCount + 1} OF ${MAX_HINTS} (-${HINT_COST}s)`}
          </Text>
        </Pressable>
      </ScrollView>
      <Animated.View pointerEvents="none" style={[styles.flash, { opacity: flash }]} />
      <ClosingWalls remaining={t.remaining} startSec={LIMIT} />
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
  hints: { marginTop: 12, padding: 12, borderRadius: 8, backgroundColor: 'rgba(20,8,8,0.85)', borderWidth: 1, borderColor: '#3a1414', gap: 6 },
  hint: { color: '#e6b34a', fontSize: 16, lineHeight: 22 },
  hintPattern: { fontFamily: 'Menlo', fontSize: 17, letterSpacing: 1 },
  flash: { position: 'absolute', ...SCREEN_BLEED, backgroundColor: colors.bloodBright, zIndex: 5 },
});
