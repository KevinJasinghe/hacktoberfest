// Fallback responses used when Gemma fails, is rate limited, or EXPO_PUBLIC_USE_MOCKS=1.
import type { Cellar, DrawingScore, PhotoCheck, Puzzle } from './gemma';
import { EASY_RIDDLES } from './riddles';

const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const shuffle = <T>(list: T[]) => [...list].sort(() => Math.random() - 0.5);

const MATH: Puzzle[] = [
  { type: 'math', question: '9 candles are lit and the wind blows out 4. How many are still lit?', answers: ['5'], hint: 'This one uses subtraction.', expression: '9 - 4' },
  { type: 'math', question: 'A ghost haunts 3 rooms a night. How many rooms in 4 nights?', answers: ['12'], hint: 'This one uses multiplication.', expression: '3 x 4' },
  { type: 'math', question: 'There are 8 bats in the attic and 5 more arrive. How many bats now?', answers: ['13'], hint: 'This one uses addition.', expression: '8 + 5' },
  { type: 'math', question: 'A spider has 8 legs. How many legs do 2 spiders have?', answers: ['16'], hint: 'This one uses multiplication.', expression: '8 x 2' },
  { type: 'math', question: 'You find 6 keys, then 7 more under the bed. How many keys is that?', answers: ['13'], hint: 'This one uses addition.', expression: '6 + 7' },
];

const PROMPTS = [
  'a ghost',
  'a bat',
  'a pumpkin',
  'a skull',
  'a spider',
  'a moon',
  'a black cat',
  'an eye',
];

const PASS_LINES = [
  'Okay, that actually slaps. I hate that it slaps.',
  'Not bad. Frame it. Next to the other things I have to live with.',
  'Passable. Truly the "mid but acceptable" of drawings.',
];
const FAIL_LINES = [
  'Bro really said "that is a ghost" with a straight face. Skill issue.',
  'I have seen better art on a cursed gravestone. Ratio.',
  'This is fine. Everything is fine. The drawing is not fine.',
];

const OBJECTS = ['pumpkin', 'balloons', 'candle', 'candy', 'plastic spider', 'paper bat', 'jack-o-lantern'];

export const mocks = {
  // One riddle (from the vetted bank) then one math puzzle, plus the spirit's lines.
  cellar: (): Cellar => {
    const riddle = pick(EASY_RIDDLES);
    return {
      puzzles: [
        { type: 'riddle', ...riddle },
        pick(MATH),
      ],
      lines: {
        intro: 'Two locks hold you here, little mouse. Solve them before the walls finish closing in...',
        wrong: 'Wrong. I can hear your heart racing.',
        solved: 'One lock falls. Do not get comfortable.',
      },
    };
  },
  drawingPrompt: (): string => pick(PROMPTS),
  // Random so both the pass and fail paths get exercised.
  scoreDrawing: (): DrawingScore => {
    const score = 55 + Math.floor(Math.random() * 41);
    return { score, comment: pick(score > 75 ? PASS_LINES : FAIL_LINES) };
  },
  pickObjects: (count = 1): string[] => shuffle(OBJECTS).slice(0, count),
  checkPhoto: (): PhotoCheck => ({ match: true, comment: 'It will do.' }),
};
