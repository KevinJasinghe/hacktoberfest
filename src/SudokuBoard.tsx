import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useAudio } from './audio';
import * as haptics from './haptics';
import { conflicts, Sudoku } from './sudoku';
import { colors } from './theme';

type Props = { sudoku: Sudoku; onSolved: () => void; hintSignal: number };

const PLAYER_DIGIT = '#e6b34a';
const SCREEN_PADDING = 40; // GameScreen's 20px padding on each side
const PANEL_PADDING = 8;

const row = (i: number) => Math.floor(i / 4);
const col = (i: number) => i % 4;
const box = (i: number) => Math.floor(row(i) / 2) * 2 + Math.floor(col(i) / 2);

// 4x4 sudoku: tap an empty cell, then a digit. `hintSignal` changes each time a hint is bought;
// it fills one empty or wrong cell with the right digit.
export default function SudokuBoard({ sudoku, onSolved, hintSignal }: Props) {
  const { puzzle, solution } = sudoku;
  const { width } = useWindowDimensions();
  const { sfx } = useAudio();
  const cellSize = Math.min(78, Math.floor((width - SCREEN_PADDING - PANEL_PADDING * 2 - 6) / 4));
  const [cells, setCells] = useState(puzzle);
  const [selected, setSelected] = useState<number | null>(null);
  const lastHint = useRef(hintSignal);
  const bad = conflicts(cells);

  const place = (i: number, n: number) => {
    haptics.tap();
    sfx('place', 0.5);
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

  // Rows are rendered explicitly (no flex-wrap), so borders can never push a cell onto a new line.
  const renderCell = (i: number) => {
    const given = puzzle[i] !== 0;
    const sel = selected === i;
    const related = selected !== null && !sel && (row(i) === row(selected) || col(i) === col(selected) || box(i) === box(selected));
    return (
      <Pressable
        key={i}
        disabled={given}
        onPress={() => {
          haptics.select();
          setSelected(i);
        }}
        style={[
          styles.cell,
          { width: cellSize, height: cellSize },
          // heavier lines between the 2x2 boxes
          col(i) === 1 && styles.boxRight,
          row(i) === 1 && styles.boxBottom,
          given && styles.given,
          related && styles.related,
          sel && styles.selected,
        ]}
      >
        <Text
          style={[
            styles.digit,
            { fontSize: cellSize * 0.5 },
            given ? styles.givenDigit : { color: PLAYER_DIGIT },
            bad.has(i) && { color: colors.bloodBright },
          ]}
        >
          {cells[i] || ''}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.panel}>
        {[0, 1, 2, 3].map((r) => (
          <View key={r} style={styles.row}>
            {[0, 1, 2, 3].map((c) => renderCell(r * 4 + c))}
          </View>
        ))}
      </View>
      <View style={styles.digits}>
        {[1, 2, 3, 4].map((n) => (
          <Pressable
            key={n}
            style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
            onPress={() => selected !== null && !puzzle[selected] && place(selected, n)}
          >
            <Text style={styles.keyText}>{n}</Text>
          </Pressable>
        ))}
        <Pressable
          style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
          onPress={() => selected !== null && !puzzle[selected] && place(selected, 0)}
        >
          <Text style={styles.keyText}>⌫</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  // a slate tablet that stays readable on top of the brick wall
  panel: {
    padding: PANEL_PADDING,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.blood,
    backgroundColor: 'rgba(12,5,5,0.9)',
    shadowColor: colors.bloodBright,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  row: { flexDirection: 'row' },
  cell: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#3a1414', backgroundColor: 'rgba(30,12,12,0.85)' },
  boxRight: { borderRightWidth: 3, borderRightColor: colors.blood },
  boxBottom: { borderBottomWidth: 3, borderBottomColor: colors.blood },
  given: { backgroundColor: 'rgba(8,3,3,0.95)' },
  related: { backgroundColor: 'rgba(90,24,24,0.55)' },
  selected: { backgroundColor: 'rgba(150,30,30,0.8)', borderColor: colors.bloodBright },
  digit: { fontWeight: '800' },
  givenDigit: { color: colors.text, fontWeight: '900' },
  digits: { flexDirection: 'row', gap: 10, marginTop: 20, alignSelf: 'stretch' },
  key: { flex: 1, height: 56, borderRadius: 10, backgroundColor: 'rgba(20,8,8,0.9)', borderWidth: 1, borderColor: colors.blood, alignItems: 'center', justifyContent: 'center' },
  keyPressed: { backgroundColor: colors.blood },
  keyText: { color: colors.text, fontSize: 24, fontWeight: '800' },
});
