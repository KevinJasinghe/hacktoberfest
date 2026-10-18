// 4x4 sudoku made by the app (not Gemma): always solvable with exactly one solution.
// Cells are a flat array of 16, row-major; 0 means empty.
export type Sudoku = { puzzle: number[]; solution: number[] };

const shuffle = <T>(list: T[]) => [...list].sort(() => Math.random() - 0.5);

// A valid solved grid.
const BASE = [1, 2, 3, 4, 3, 4, 1, 2, 2, 1, 4, 3, 4, 3, 2, 1];

// Shuffle digits, rows inside each band, columns inside each stack, and the bands/stacks themselves.
function randomSolution(): number[] {
  const digits = shuffle([1, 2, 3, 4]);
  const order = () => shuffle([0, 1]).flatMap((band) => shuffle([0, 1]).map((i) => band * 2 + i));
  const rows = order();
  const cols = order();
  return rows.flatMap((r) => cols.map((c) => digits[BASE[r * 4 + c] - 1]));
}

function allowed(grid: number[], i: number, n: number): boolean {
  const r = Math.floor(i / 4);
  const c = i % 4;
  for (let k = 0; k < 4; k++) {
    if (grid[r * 4 + k] === n || grid[k * 4 + c] === n) return false;
  }
  const br = r - (r % 2);
  const bc = c - (c % 2);
  for (let dr = 0; dr < 2; dr++) {
    for (let dc = 0; dc < 2; dc++) {
      if (grid[(br + dr) * 4 + bc + dc] === n) return false;
    }
  }
  return true;
}

// Counts solutions, stopping at `limit`.
function countSolutions(grid: number[], limit = 2): number {
  const i = grid.indexOf(0);
  if (i < 0) return 1;
  let found = 0;
  for (let n = 1; n <= 4 && found < limit; n++) {
    if (!allowed(grid, i, n)) continue;
    grid[i] = n;
    found += countSolutions(grid, limit - found);
    grid[i] = 0;
  }
  return found;
}

export function generateSudoku(blanks = 9): Sudoku {
  const solution = randomSolution();
  const puzzle = [...solution];
  let removed = 0;
  for (const i of shuffle([...Array(16).keys()])) {
    if (removed >= blanks) break;
    const kept = puzzle[i];
    puzzle[i] = 0;
    if (countSolutions([...puzzle]) === 1) removed++;
    else puzzle[i] = kept; // removing it would allow a second solution
  }
  return { puzzle, solution };
}

// Indexes of filled cells that repeat a digit in their row, column or 2x2 box.
export function conflicts(grid: number[]): Set<number> {
  const bad = new Set<number>();
  for (let i = 0; i < 16; i++) {
    if (!grid[i]) continue;
    for (let j = i + 1; j < 16; j++) {
      if (grid[j] !== grid[i]) continue;
      const sameRow = Math.floor(i / 4) === Math.floor(j / 4);
      const sameCol = i % 4 === j % 4;
      const sameBox = Math.floor(i / 8) === Math.floor(j / 8) && Math.floor((i % 4) / 2) === Math.floor((j % 4) / 2);
      if (sameRow || sameCol || sameBox) {
        bad.add(i);
        bad.add(j);
      }
    }
  }
  return bad;
}
