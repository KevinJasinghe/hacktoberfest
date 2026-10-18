import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as haptics from './haptics';
import { colors } from './theme';

const ROWS = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['⌫', '0', '↵']];

// On-screen keypad so number answers never open the keyboard. Keys: '0'-'9', '⌫' (backspace), '↵' (submit).
export default function NumberPad({ onKey }: { onKey: (key: string) => void }) {
  return (
    <View style={styles.pad}>
      {ROWS.map((row) => (
        <View key={row[0]} style={styles.row}>
          {row.map((k) => (
            <Pressable
              key={k}
              style={({ pressed }) => [styles.key, pressed && styles.pressed]}
              onPress={() => {
                haptics.tap();
                onKey(k);
              }}
            >
              <Text style={styles.text}>{k}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  key: { flex: 1, height: 56, borderRadius: 10, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.blood, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: colors.blood },
  text: { color: colors.text, fontSize: 24, fontWeight: '800' },
});
