import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { RunResult } from './GameScreen';
import { formatTime } from './TimerBar';
import { TIMEOUT_PENALTY } from './scoring';
import { colors, ui } from './theme';

export default function ResultsScreen({ result, onDone }: { result: RunResult; onDone: () => void }) {
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
      <Pressable style={ui.button} onPress={onDone}>
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
