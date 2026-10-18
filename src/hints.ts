import type { Puzzle } from './gemma';

export const MAX_HINTS = 3; // rungs per puzzle; each one costs time (HINT_COST in Level1)

// The operations a math expression uses, in words: "subtraction and addition".
export function describeOps(expression: string): string {
  const e = expression.replace(/[×x✕]/gi, '*').replace(/÷/g, '/');
  const names: string[] = [];
  if (/[+]/.test(e)) names.push('addition');
  if (/-/.test(e.replace(/^-/, ''))) names.push('subtraction');
  if (/\*/.test(e)) names.push('multiplication');
  if (/\//.test(e)) names.push('division');
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0] ?? 'arithmetic';
}

const pretty = (expression: string) =>
  expression.replace(/[x*✕]/gi, '×').replace(/\//g, '÷').replace(/(\d)\s*-\s*(?=[\d(])/g, '$1 − ').replace(/\s+/g, ' ').trim();

// "S _ _ _ _ _" for the letters whose position passes `show`; other characters (spaces) stay as they are.
function pattern(answer: string, show: (i: number) => boolean): string {
  return answer
    .split('')
    .map((c, i) => (c === ' ' ? '  ' : show(i) ? c.toUpperCase() : '_'))
    .join(' ');
}

// The first step of the arithmetic, in the order the player should do it: a multiplication or division if there
// is one, otherwise the leftmost pair. Returns null for anything with brackets, which rung 3 then skips.
function firstStep(expression: string): string | null {
  const e = expression.replace(/[×x✕]/gi, '*').replace(/÷/g, '/').replace(/\s+/g, '');
  if (/[()]/.test(e)) return null;
  const tokens = e.match(/\d+(?:\.\d+)?|[+\-*/]/g);
  if (!tokens || tokens.length < 3) return null;
  let at = tokens.findIndex((t) => t === '*' || t === '/');
  if (at < 0) at = tokens.findIndex((t) => t === '+' || t === '-');
  if (at < 1) return null;
  const a = Number(tokens[at - 1]);
  const b = Number(tokens[at + 1]);
  const op = tokens[at];
  const r = op === '*' ? a * b : op === '/' ? a / b : op === '+' ? a + b : a - b;
  const symbol = { '*': '×', '/': '÷', '+': '+', '-': '−' }[op];
  return `Start with ${a} ${symbol} ${b}, which is ${r}.`;
}

// The three rungs of help for a puzzle, weakest first. Everything past the first is built from the known
// answer, so it is always correct and always useful.
export function hintsFor(p: Puzzle): string[] {
  const answer = p.answers[0];
  if (p.type === 'riddle') {
    return [
      p.hint,
      `The answer has ${answer.replace(/ /g, '').length} letters:  ${pattern(answer, (i) => i === 0)}`,
      `Some more letters:  ${pattern(answer, (i) => i % 2 === 0)}`,
    ];
  }
  const last = answer.slice(-1);
  return [
    p.hint,
    p.expression ? `As an equation:  ${pretty(p.expression)} = ?` : `The answer has ${answer.length} digit${answer.length > 1 ? 's' : ''}.`,
    (p.expression && firstStep(p.expression)) || `The answer ends in ${last}.`,
  ];
}
