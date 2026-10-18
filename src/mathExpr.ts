// Evaluates the arithmetic expression Gemma writes for a math puzzle ("13 - 5 + 2", "3 x (4 + 2)"), so the
// answer is computed by the app and never trusted from the model. Only digits, + - * / x × ÷ and
// parentheses are accepted; anything else throws.
export function evaluate(input: string): number {
  if (/\d\s+\d/.test(input)) throw new Error(`bad expression: ${input}`); // "2 3" must not become 23
  const src = input.replace(/[×x✕]/gi, '*').replace(/÷/g, '/').replace(/\s+/g, '');
  if (!src || /[^0-9+\-*/().]/.test(src)) throw new Error(`bad expression: ${input}`);
  let i = 0;

  const number = (): number => {
    const start = i;
    while (i < src.length && /[0-9.]/.test(src[i])) i++;
    if (start === i) throw new Error(`bad expression: ${input}`);
    return Number(src.slice(start, i));
  };
  const factor = (): number => {
    if (src[i] === '-') {
      i++;
      return -factor();
    }
    if (src[i] === '(') {
      i++;
      const v = expr();
      if (src[i++] !== ')') throw new Error(`bad expression: ${input}`);
      return v;
    }
    return number();
  };
  const term = (): number => {
    let v = factor();
    while (src[i] === '*' || src[i] === '/') {
      const op = src[i++];
      const rhs = factor();
      if (op === '/' && rhs === 0) throw new Error('division by zero');
      v = op === '*' ? v * rhs : v / rhs;
    }
    return v;
  };
  function expr(): number {
    let v = term();
    while (src[i] === '+' || src[i] === '-') {
      const op = src[i++];
      const rhs = term();
      v = op === '+' ? v + rhs : v - rhs;
    }
    return v;
  }

  const result = expr();
  if (i !== src.length) throw new Error(`bad expression: ${input}`);
  return result;
}
