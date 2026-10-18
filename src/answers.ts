const NUMBER_WORDS: Record<string, string> = {
  zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9',
  ten: '10', eleven: '11', twelve: '12', thirteen: '13', fourteen: '14', fifteen: '15', sixteen: '16',
  seventeen: '17', eighteen: '18', nineteen: '19',
};
const TENS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };

// "twenty eight" / "twenty-eight" -> "28"
function joinNumbers(words: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const tens = TENS[words[i]];
    if (tens === undefined) {
      out.push(NUMBER_WORDS[words[i]] ?? words[i]);
      continue;
    }
    const unit = Number(NUMBER_WORDS[words[i + 1]]);
    if (unit >= 1 && unit <= 9) {
      out.push(String(tens + unit));
      i++;
    } else out.push(String(tens));
  }
  return out;
}

// Lowercase, drop punctuation and filler words, and turn number words into digits.
export function normalize(text: string): string {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !['a', 'an', 'the', 'your', 'my'].includes(w));
  return joinNumbers(words).join(' ');
}

// Loose match: ignores case, spacing, punctuation, articles and simple plurals.
export function isCorrect(input: string, answers: string[]): boolean {
  const guess = normalize(input);
  if (!guess) return false;
  const singular = (s: string) => s.replace(/s\b/g, '');
  return answers.some((a) => {
    const target = normalize(a);
    return guess === target || singular(guess) === singular(target);
  });
}
