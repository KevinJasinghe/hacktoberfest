// Fallback responses used when Gemma fails, is rate limited, or EXPO_PUBLIC_USE_MOCKS=1.
import type { Cellar, DrawingScore, PhotoCheck, Puzzle } from './gemma';
import { RIDDLES } from './riddles';

const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const shuffle = <T>(list: T[]) => [...list].sort(() => Math.random() - 0.5);

const MATH: Puzzle[] = [
  { type: 'math', question: 'A coffin holds 3 skeletons. How many coffins do you need for 21 skeletons?', answers: ['7'], hint: '21 divided by 3.' },
  { type: 'math', question: 'A ghost haunts 4 rooms a night. How many rooms does it haunt in a week?', answers: ['28'], hint: 'There are 7 nights in a week.' },
  { type: 'math', question: '13 candles are lit. The wind blows out 5, then you relight 2. How many are lit?', answers: ['10'], hint: '13 - 5, then + 2.' },
  { type: 'math', question: 'What is 6 × 6 + 6?', answers: ['42'], hint: 'Multiply first, then add.' },
  { type: 'math', question: 'A spider has 8 legs. How many legs do 5 spiders have?', answers: ['40'], hint: '8 times 5.' },
];

const PROMPTS = [
  'A ghost peeking out of a closet',
  'A haunted house on a hill',
  'A jack-o-lantern with a crooked grin',
  'A bat flying past a full moon',
  'A skeleton hand rising from a grave',
  'A spider hanging from its web',
];

const OBJECTS = ['spoon', 'key', 'candle', 'scissors', 'sock', 'flashlight', 'mug', 'book', 'toothbrush', 'pen'];

export const mocks = {
  // One riddle (from the vetted bank) then one math puzzle, plus the spirit's lines.
  cellar: (): Cellar => {
    const riddle = pick(RIDDLES);
    return {
      puzzles: [
        { type: 'riddle', ...riddle, hint: `It starts with the letter "${riddle.answers[0][0].toUpperCase()}".` },
        pick(MATH),
      ],
      lines: {
        intro: 'Three locks hold you here, little mouse. Solve them before the walls finish closing in...',
        wrong: 'Wrong. I can hear your heart racing.',
        solved: 'One lock falls. Do not get comfortable.',
      },
    };
  },
  drawingPrompt: (): string => pick(PROMPTS),
  // Random so both the pass and fail paths get exercised.
  scoreDrawing: (): DrawingScore => {
    const score = 55 + Math.floor(Math.random() * 41);
    return { score, comment: score > 75 ? 'Fine. You may pass... for now.' : 'Pathetic. Again.' };
  },
  pickObjects: (): string[] => shuffle(OBJECTS).slice(0, 2),
  checkPhoto: (): PhotoCheck => ({ match: true, comment: 'It will do.' }),
};
