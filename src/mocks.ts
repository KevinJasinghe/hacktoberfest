// Fallback responses used when Gemma fails, is rate limited, or EXPO_PUBLIC_USE_MOCKS=1.
import type { DrawingScore, PhotoCheck, Puzzle } from './gemma';

const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const shuffle = <T>(list: T[]) => [...list].sort(() => Math.random() - 0.5);

const PUZZLES: Puzzle[] = [
  { type: 'riddle', question: 'The more of me you take, the more you leave behind. What am I?', answers: ['footsteps', 'steps'] },
  { type: 'riddle', question: 'I have keys but open no locks. What am I?', answers: ['piano', 'keyboard'] },
  { type: 'riddle', question: 'What has a face and two hands but no arms or legs?', answers: ['clock', 'watch'] },
  { type: 'riddle', question: 'What can you hold in your right hand but never in your left?', answers: ['your left hand', 'left hand', 'left elbow'] },
  { type: 'riddle', question: 'I follow you all day but vanish in the dark. What am I?', answers: ['shadow', 'your shadow'] },
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
  puzzles: (count: number): Puzzle[] => shuffle(PUZZLES).slice(0, count),
  drawingPrompt: (): string => pick(PROMPTS),
  // Random so both the pass and fail paths get exercised.
  scoreDrawing: (): DrawingScore => {
    const score = 55 + Math.floor(Math.random() * 41);
    return { score, comment: score > 75 ? 'Fine. You may pass... for now.' : 'Pathetic. Again.' };
  },
  pickObjects: (): string[] => shuffle(OBJECTS).slice(0, 2),
  checkPhoto: (): PhotoCheck => ({ match: true, comment: 'It will do.' }),
};
