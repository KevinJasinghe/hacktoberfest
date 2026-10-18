import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { getLeaderboard, LeaderboardEntry } from './firebase';
import Loader from './Loader';
import { formatTime } from './TimerBar';
import { colors, ui } from './theme';

export default function LeaderboardScreen({ uid, onBack }: { uid?: string; onBack: () => void }) {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getLeaderboard()
      .then(setEntries)
      .catch((e) => {
        console.warn('[leaderboard]', e);
        setError(true);
      });
  }, []);

  return (
    <View style={ui.screen}>
      <Text style={[ui.title, { marginBottom: 4 }]}>THE ESCAPED</Text>
      <Text style={[ui.dim, { textAlign: 'center', marginBottom: 16 }]}>Few have made it out.</Text>
      {error && <Text style={[ui.body, { color: colors.bloodBright, textAlign: 'center' }]}>The spirits hid the scores. Try again later.</Text>}
      {!entries && !error && <Loader text="Counting the survivors..." />}
      {entries && (
        <FlatList
          data={entries}
          keyExtractor={(e) => e.uid}
          ListEmptyComponent={<Text style={[ui.dim, { textAlign: 'center' }]}>No one has escaped yet. Be the first.</Text>}
          renderItem={({ item, index }) => (
            <View style={[styles.row, item.uid === uid && styles.me]}>
              <Text style={[styles.rank, index < 3 && { color: colors.bloodBright }]}>{index + 1}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {item.displayName}
              </Text>
              <Text style={styles.time}>{formatTime(item.bestTime)}</Text>
              <Text style={styles.score}>{item.bestScore}</Text>
            </View>
          )}
        />
      )}
      <Pressable style={ui.buttonGhost} onPress={onBack}>
        <Text style={ui.buttonText}>BACK</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: colors.panel },
  me: { backgroundColor: colors.panel, borderRadius: 6 },
  rank: { color: colors.dim, width: 32, fontSize: 18, fontWeight: '900' },
  name: { color: colors.text, flex: 1, fontSize: 17 },
  time: { color: colors.dim, width: 56, textAlign: 'right', fontVariant: ['tabular-nums'] },
  score: { color: colors.text, width: 70, textAlign: 'right', fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
