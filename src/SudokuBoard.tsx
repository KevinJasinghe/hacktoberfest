import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { conflicts, Sudoku } from './sudoku';
import { colors } from './theme';

type Props = { sudoku: Sudoku; onSolved: () => void; hintSignal: number };

// 4x4 sudoku: tap an empty cell, then a digit. `hintSignal` changes each time a hint is bought;
// it fills one empty or wrong cell with the right digit.
export default function SudokuBoard({ sudoku, onSolved, hintSignal }: Props) {
  const { puzzle, solution } = sudoku;
  const [cells, setCells] = useState(puzzle);
  const [selected, setSelected] = useState<number | null>(null);
  const lastHint = useRef(hintSignal);
  const bad = conflicts(cells);

  const place = (i: number, n: number) => {
    const next = [...cells];
    next[i] = n;
    setCells(next);
    if (next.every((v, k) => v === solution[k])) onSolved();
  };

  useEffect(() => {
    if (hintSignal === lastHint.current) return;
    lastHint.current = hintSignal;
    const fixable = cells.map((v, i) => (puzzle[i] === 0 && v !== solution[i] ? i : -1)).filter((i) => i >= 0);
    if (!fixable.length) return;
    const i = fixable[Math.floor(Math.random() * fixable.length)];
    place(i, solution[i]);
  }, [hintSignal]);

  return (
    <View>
      <View style={styles.grid}>
        {cells.map((v, i) => {
          const given = puzzle[i] !== 0;
          const sel = selected === i;
          return (
            <Pressable
              key={i}
              disabled={given}
              onPress={() => setSelected(i)}
              style={[
                styles.cell,
                // thicker lines between the 2x2 boxes
                i % 4 === 1 && { borderRightWidth: 3 },
                Math.floor(i / 4) === 1 && { borderBottomWidth: 3 },
                given && styles.given,
                sel && styles.selected,
              ]}
            >
              <Text style={[styles.digit, given && { color: colors.dim }, bad.has(i) && { color: colors.bloodBright }]}>
                {v || ''}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.digits}>
        {[1, 2, 3, 4].map((n) => (
          <Pressable key={n} style={styles.digitKey} onPress={() => selected !== null && place(selected, n)}>
            <Text style={styles.digit}>{n}</Text>
          </Pressable>
        ))}
        <Pressable style={styles.digitKey} onPress={() => selected !== null && place(selected, 0)}>
          <Text style={styles.digit}>⌫</Text>
        </Pressable>
      </View>
    </View>
  );
}

const SIZE = 72;
const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: SIZE * 4, alignSelf: 'center', borderWidth: 3, borderColor: colors.blood },
  cell: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.blood, backgroundColor: colors.panel },
  given: { backgroundColor: '#0c0505' },
  selected: { backgroundColor: '#3a0d0d' },
  digit: { color: colors.text, fontSize: 30, fontWeight: '800' },
  digits: { flexDirection: 'row', gap: 10, marginTop: 20 },
  digitKey: { flex: 1, height: 56, borderRadius: 10, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.blood, alignItems: 'center', justifyContent: 'center' },
});
