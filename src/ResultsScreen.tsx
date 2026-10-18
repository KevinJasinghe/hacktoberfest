import type { User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { saveRun } from './firebase';
import type { RunResult } from './GameScreen';
import { formatTime } from './TimerBar';
import { TIMEOUT_PENALTY } from './scoring';
import { colors, ui } from './theme';

export default function ResultsScreen({ result, user, onDone }: { result: RunResult; user: User | null; onDone: () => void }) {
  const [saved, setSaved] = useState<'saving' | 'saved' | 'failed' | null>(user ? 'saving' : null);

  // Only completed runs reach this screen, so every run saved here is a finished one.
  useEffect(() => {
    if (!user) return;
    saveRun(user, result)
      .then(() => setSaved('saved'))
      .catch((e) => {
        console.warn('[saveRun]', e);
        setSaved('failed');
      });
  }, []);

  return (
    <View style={ui.center}>
      <Text style={ui.title}>YOU ESCAPED</Text>
      <Text style={styles.score}>{result.totalScore}</Text>
      <Text style={ui.dim}>total score · {formatTime(result.totalTime)} total</Text>
      <View style={styles.table}>
        {result.levelPoints.map((p, i) => (
          <View key={i} style={styles.row}>
            <Text style={ui.body}>Level {i + 1}</Text>
            <Text style={ui.body}>
              {formatTime(result.levelTimes[i])} · {p} pts
            </Text>
          </View>
        ))}
        {result.timeouts > 0 && (
          <View style={styles.row}>
            <Text style={[ui.body, { color: colors.bloodBright }]}>Timeouts ×{result.timeouts}</Text>
            <Text style={[ui.body, { color: colors.bloodBright }]}>−{result.timeouts * TIMEOUT_PENALTY}</Text>
          </View>
        )}
      </View>
      {saved === 'saving' && <Text style={ui.dim}>Carving your name into the wall...</Text>}
      {saved === 'saved' && <Text style={ui.dim}>Run saved. Your best run counts on the leaderboard.</Text>}
      {saved === 'failed' && <Text style={[ui.dim, { color: colors.bloodBright }]}>Couldn't save your score.</Text>}
      <Pressable style={[ui.button, { alignSelf: 'stretch' }]} onPress={onDone} disabled={saved === 'saving'}>
        <Text style={ui.buttonText}>CONTINUE</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  score: { color: colors.text, fontSize: 64, fontWeight: '900', marginTop: 16 },
  table: { alignSelf: 'stretch', marginTop: 24, marginBottom: 16, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});
