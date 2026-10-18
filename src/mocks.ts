// Fallback responses used when Gemma fails, is rate limited, or EXPO_PUBLIC_USE_MOCKS=1.
import type { DrawingScore, PhotoCheck, Puzzle } from './gemma';
import { RIDDLES } from './riddles';

const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const shuffle = <T>(list: T[]) => [...list].sort(() => Math.random() - 0.5);

const MATH: Puzzle[] = [
  { type: 'math', question: 'A coffin holds 3 skeletons. How many coffins do you need for 21 skeletons?', answers: ['7'] },
  { type: 'math', question: 'A ghost haunts 4 rooms a night. How many rooms does it haunt in a week?', answers: ['28'] },
  { type: 'math', question: '13 candles are lit. The wind blows out 5, then you relight 2. How many are lit?', answers: ['10'] },
  { type: 'math', question: 'What is 6 × 6 + 6?', answers: ['42'] },
  { type: 'math', question: 'A spider has 8 legs. How many legs do 5 spiders have?', answers: ['40'] },
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
  // Same mix as Gemma's: 1 riddle, the rest math.
  puzzles: (count: number): Puzzle[] =>
    shuffle([{ type: 'riddle' as const, ...pick(RIDDLES) }, ...shuffle(MATH).slice(0, count - 1)]),
  drawingPrompt: (): string => pick(PROMPTS),
  // Random so both the pass and fail paths get exercised.
  scoreDrawing: (): DrawingScore => {
    const score = 55 + Math.floor(Math.random() * 41);
    return { score, comment: score > 75 ? 'Fine. You may pass... for now.' : 'Pathetic. Again.' };
  },
  pickObjects: (): string[] => shuffle(OBJECTS).slice(0, 2),
  checkPhoto: (): PhotoCheck => ({ match: true, comment: 'It will do.' }),
};
