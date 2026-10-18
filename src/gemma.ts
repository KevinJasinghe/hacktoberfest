// Gemma 4 dungeon master, called through Google's Gemini API with plain fetch.
// Every wrapper falls back to src/mocks.ts if the call fails or returns bad JSON.
import { evaluate } from './mathExpr';
import { mocks } from './mocks';
import { RIDDLES } from './riddles';

const MODEL = 'gemma-4-26b-a4b-it';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const API_KEY = process.env.EXPO_PUBLIC_GEMMA_API_KEY ?? '';
const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === '1' || !API_KEY;
const TIMEOUT_MS = 15000;

const PERSONA =
  'You are the malevolent spirit haunting a house, acting as dungeon master in a horror escape game. ' +
  'You are cruel and theatrical but keep everything PG-13. ';

// Random ingredients for each call: without them Gemma returns the same favorites every time.
const THEMES = [
  'a haunted doll', 'a graveyard at midnight', 'a witch\'s kitchen', 'a vampire\'s crypt', 'a cursed mirror', 'a ghost ship',
  'a werewolf in the woods', 'an abandoned asylum', 'a pumpkin patch', 'a mummy\'s tomb', 'a spider\'s lair', 'a creepy carnival',
  'a haunted library', 'a zombie in the garden', 'a black cat', 'a raven at the window', 'a skeleton band', 'a phantom train',
];
const HOUSEHOLD_OBJECTS = [
  'spoon', 'fork', 'knife', 'key', 'candle', 'scissors', 'sock', 'shoe', 'flashlight', 'mug', 'cup', 'book', 'toothbrush', 'pen',
  'pencil', 'remote', 'hairbrush', 'comb', 'towel', 'pillow', 'blanket', 'bottle', 'lighter', 'coin', 'mirror', 'clock', 'watch',
  'glasses', 'hat', 'umbrella', 'charger', 'headphones', 'plate', 'bowl', 'tape', 'rope', 'string', 'battery', 'wallet', 'lamp',
];
const sample = <T>(list: T[], n: number) => [...list].sort(() => Math.random() - 0.5).slice(0, n);

export type Puzzle = { type: 'riddle' | 'math'; question: string; answers: string[]; hint: string };
// What the spirit says during Level 1; shown with a typewriter effect.
export type SpiritLines = { intro: string; wrong: string; solved: string };
export type Cellar = { puzzles: Puzzle[]; lines: SpiritLines };
export type DrawingScore = { score: number; comment: string };
export type PhotoCheck = { match: boolean; comment: string };

async function post(body: object): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

// Low temperature keeps judging consistent; generated content uses CREATIVE so resets and replays differ.
const CREATIVE = 1.0;

// Sends one prompt (plus an optional base64 JPEG) and returns the parsed JSON reply.
export async function ask(prompt: string, imageBase64?: string, temperature = 0.2): Promise<unknown> {
  const parts: object[] = [{ text: PERSONA + prompt + '\nRespond with JSON only. No markdown, no prose.' }];
  if (imageBase64) parts.push({ inline_data: { mime_type: 'image/jpeg', data: imageBase64 } });
  const contents = [{ role: 'user', parts }];

  let res = await post({ contents, generationConfig: { temperature, thinkingConfig: { thinkingLevel: 'MINIMAL' } } });
  // Retry once without thinkingConfig in case this model rejects it.
  if (res.status === 400) res = await post({ contents, generationConfig: { temperature } });
  if (!res.ok) throw new Error(`Gemma HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const data = await res.json();
  const text: string = (data?.candidates?.[0]?.content?.parts ?? [])
    .filter((p: { thought?: boolean; text?: string }) => !p.thought && p.text)
    .map((p: { text: string }) => p.text)
    .join('');
  return parseJson(text);
}

export function parseJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.search(/[[{]/);
  const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
  if (start < 0 || end < start) throw new Error(`No JSON in Gemma reply: ${text.slice(0, 120)}`);
  return JSON.parse(cleaned.slice(start, end + 1));
}

// Runs a Gemma call and validates it; on any failure logs why and returns the mock.
async function withFallback<T>(name: string, call: () => Promise<T>, mock: () => T): Promise<T> {
  if (USE_MOCKS) return mock();
  try {
    return await call();
  } catch (e) {
    console.warn(`[gemma] ${name} failed, using mock:`, e instanceof Error ? e.message : e);
    return mock();
  }
}

const str = (v: unknown, field: string): string => {
  if (typeof v !== 'string' || !v.trim()) throw new Error(`bad ${field}`);
  return v.trim();
};

// Level 1 content: one riddle and one math puzzle (the third lock is a sudoku the app builds itself).
//
// The prompt is rigid on purpose, and every answer is checked by the app instead of trusted:
//  - the riddle comes from our vetted bank (src/riddles.ts), so its answer is known; Gemma only retells it,
//    and a retelling that gives the answer away is rejected;
//  - the math problem comes back as an arithmetic expression that the app evaluates itself (src/mathExpr.ts),
//    and every number in it must be stated in the question text.
// A bad reply is retried once, then falls back to the mocks.
const ATTEMPTS = 2;

type RawCellar = {
  riddle?: { index?: unknown; question?: unknown; hint?: unknown };
  math?: { question?: unknown; expression?: unknown; hint?: unknown };
  lines?: Record<string, unknown>;
};

async function buildCellar(): Promise<Cellar> {
  const options = sample(RIDDLES, 5);
  const theme = sample(THEMES, 1)[0];
  const r = (await ask(
    'You are writing the first two locks of an escape room. Follow these rules exactly.\n\n' +
      'LOCK 1, RIDDLE: pick exactly ONE riddle from this numbered list and retell it in one or two short, spooky sentences. ' +
      'Keep the same meaning so the answer does not change, and never say the answer.\n' +
      options.map((o, i) => `${i}) ${o.question} (answer: ${o.answers[0]})`).join('\n') +
      `\n\nLOCK 2, MATH: write ONE word problem themed around ${theme}. ` +
      'It must be plain arithmetic with whole numbers and the operators + - x only. ' +
      'Write every number as digits and state every number the player needs inside the question. ' +
      'Give the arithmetic as "expression" (for example "13 - 5 + 2"); the game computes the answer itself, so do not give one. ' +
      'The result must be a whole number from 2 to 99, solvable in under 30 seconds.\n\n' +
      'For each lock also write a "hint": one short sentence that nudges the player without giving the answer away. ' +
      'Then write three taunts of one short sentence each: "intro" greeting the player, "wrong" for a wrong answer, "solved" for when a lock opens.\n\n' +
      'Reply with JSON only, in exactly this shape: ' +
      '{"riddle":{"index":0,"question":"...","hint":"..."},"math":{"question":"...","expression":"...","hint":"..."},"lines":{"intro":"...","wrong":"...","solved":"..."}}',
    undefined,
    CREATIVE,
  )) as RawCellar;

  // Riddle: the answer comes from our bank, never from the model.
  const chosen = options[Number(r.riddle?.index)];
  if (!chosen) throw new Error('bad riddle index');
  const riddleText = str(r.riddle?.question, 'riddle');
  if (chosen.answers.some((a) => new RegExp(`\\b${a}\\b`, 'i').test(riddleText))) throw new Error('riddle gives away its answer');

  // Math: the app computes the answer from the expression, and the question must state every number in it.
  const expression = str(r.math?.expression, 'expression');
  const mathText = str(r.math?.question, 'math question');
  const answer = evaluate(expression);
  if (!Number.isInteger(answer) || answer < 2 || answer > 99) throw new Error(`bad math answer ${answer}`);
  for (const n of expression.match(/\d+/g) ?? []) {
    if (!new RegExp(`(^|\\D)${n}(\\D|$)`).test(mathText)) throw new Error(`question never states ${n}`);
  }

  const lines = r.lines ?? {};
  return {
    puzzles: [
      { type: 'riddle', question: riddleText, answers: chosen.answers, hint: str(r.riddle?.hint, 'riddle hint') },
      { type: 'math', question: mathText, answers: [String(answer)], hint: str(r.math?.hint, 'math hint') },
    ],
    lines: { intro: str(lines.intro, 'intro'), wrong: str(lines.wrong, 'wrong'), solved: str(lines.solved, 'solved') },
  };
}

export function generatePuzzles(): Promise<Cellar> {
  return withFallback(
    'generatePuzzles',
    async () => {
      let lastError: unknown;
      for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
        try {
          return await buildCellar();
        } catch (e) {
          lastError = e;
          console.warn(`[gemma] generatePuzzles attempt ${attempt} rejected:`, e instanceof Error ? e.message : e);
        }
      }
      throw lastError;
    },
    mocks.cellar,
  );
}

export function drawingPrompt(): Promise<string> {
  return withFallback(
    'drawingPrompt',
    async () => {
      const r = (await ask(
        `Give the player one spooky thing to draw with their finger in under a minute, inspired by ${sample(THEMES, 1)[0]}. ` +
          'Keep it to one simple, recognizable object or creature in at most 4 words, with no scene or extra details (e.g. "a bat", "a jack-o-lantern"). ' +
          'Format: {"prompt":"..."}',
        undefined,
        CREATIVE,
      )) as { prompt?: unknown };
      return str(r.prompt, 'prompt');
    },
    mocks.drawingPrompt,
  );
}

export function scoreDrawing(imageBase64: string, prompt: string): Promise<DrawingScore> {
  return withFallback(
    'scoreDrawing',
    async () => {
      const r = (await ask(
        `The player was told to draw: "${prompt}". This image is their finger drawing (white lines on black). ` +
          'Score from 0 to 100 how well it depicts the prompt. Judge recognizability, not artistic skill; a clear, simple sketch of the right thing deserves 80+. ' +
          'A blank, random, or wrong drawing scores under 40. Add a one-sentence taunting comment. ' +
          'Format: {"score":number,"comment":"..."}',
        imageBase64,
      )) as { score?: unknown; comment?: unknown };
      const score = Number(r.score);
      if (!Number.isFinite(score)) throw new Error('bad score');
      return { score: Math.max(0, Math.min(100, Math.round(score))), comment: typeof r.comment === 'string' ? r.comment : '' };
    },
    mocks.scoreDrawing,
  );
}

export function pickObjects(): Promise<string[]> {
  return withFallback(
    'pickObjects',
    async () => {
      const r = (await ask(
        `Pick 2 different objects the player must find and photograph to escape, choosing from: ${sample(HOUSEHOLD_OBJECTS, 12).join(', ')}. ` +
          'Choose the two that feel spookiest or most useful for an escape. Use the names exactly as listed. ' +
          'Format: {"objects":["...","..."]}',
        undefined,
        CREATIVE,
      )) as { objects?: unknown[] };
      const objects = (r.objects ?? []).map((o) => str(o, 'object').toLowerCase());
      if (objects.length < 2 || objects[0] === objects[1]) throw new Error('need 2 distinct objects');
      return objects.slice(0, 2);
    },
    mocks.pickObjects,
  );
}

export function checkPhoto(imageBase64: string, objectName: string): Promise<PhotoCheck> {
  return withFallback(
    'checkPhoto',
    async () => {
      const r = (await ask(
        `The player was told to photograph a ${objectName}. Does this photo clearly show a ${objectName}? ` +
          'Be fair: any real example of it counts, even partly visible. Add a one-sentence comment, taunting if they failed. ' +
          'Format: {"match":true|false,"comment":"..."}',
        imageBase64,
      )) as { match?: unknown; comment?: unknown };
      if (typeof r.match !== 'boolean') throw new Error('bad match');
      return { match: r.match, comment: typeof r.comment === 'string' ? r.comment : '' };
    },
    mocks.checkPhoto,
  );
}
