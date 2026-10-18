// Gemma 4 dungeon master, called through Google's Gemini API with plain fetch.
// Every wrapper falls back to src/mocks.ts if the call fails or returns bad JSON.
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

export type Puzzle = { type: 'riddle' | 'math'; question: string; answers: string[] };
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

export function generatePuzzles(count = 3): Promise<Puzzle[]> {
  return withFallback(
    'generatePuzzles',
    async () => {
      const options = sample(RIDDLES, 6);
      const mathCount = count - 1;
      const r = (await ask(
        'The player must solve puzzles to escape the cellar. ' +
          `First, pick ONE of these classic riddles and retell it in a short, spooky way that keeps the same answer:\n` +
          options.map((o, i) => `${i}) ${o.question} (answer: ${o.answers[0]})`).join('\n') +
          `\nThen write ${mathCount} simple mental-math word problems themed around ${sample(THEMES, mathCount).join(' and ')}. ` +
          'Each must be plain arithmetic where every number is stated outright (no guessing how many legs, faces, etc.), ' +
          'solvable in under 30 seconds, with a whole-number answer. Double-check the arithmetic. ' +
          `Format: {"riddle":{"index":number,"question":"..."},"math":[{"question":"...","answer":number}]} with exactly ${mathCount} math items.`,
        undefined,
        CREATIVE,
      )) as { riddle?: { index?: unknown; question?: unknown }; math?: unknown[] };
      const chosen = options[Number(r.riddle?.index)];
      if (!chosen) throw new Error('bad riddle index');
      const riddle: Puzzle = { type: 'riddle', question: str(r.riddle?.question, 'riddle'), answers: chosen.answers };
      const math = (r.math ?? []).slice(0, mathCount).map((m) => {
        const q = m as Record<string, unknown>;
        const answer = Number(q.answer);
        if (!Number.isInteger(answer)) throw new Error('bad math answer');
        return { type: 'math', question: str(q.question, 'math question'), answers: [String(answer)] } as Puzzle;
      });
      if (math.length < mathCount) throw new Error(`only ${math.length} math puzzles`);
      return sample([riddle, ...math], count);
    },
    () => mocks.puzzles(count),
  );
}

export function drawingPrompt(): Promise<string> {
  return withFallback(
    'drawingPrompt',
    async () => {
      const r = (await ask(
        `Give the player one spooky thing to draw with their finger in under 30 seconds, loosely inspired by ${sample(THEMES, 1)[0]}. ` +
          'It must be a single, very simple shape a child could sketch in 10 seconds: one or two words, no scene, no details, nothing with many parts ' +
          '(e.g. "a ghost", "a bat", "a pumpkin", "a skull", "a moon", "a cat", "an eye"). ' +
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
        `The player was told to draw: "${prompt}". This image is their finger drawing (coloured lines on a black background; colours are just the player's choice). ` +
          'Score from 0 to 100 how well it depicts the prompt. Judge recognizability, not artistic skill; a clear, simple sketch of the right thing deserves 80+. ' +
          'A blank, random, or wrong drawing scores under 40. ' +
          'Also write a short, genuinely funny comment (max 20 words) about what you actually see in the drawing. Be a smug, taunting haunting spirit with Reddit-style humour: ' +
          'dry deadpan sarcasm, exaggerated understatement, internet-comment energy (think "bro", "skill issue", "this is fine", mock-serious reviews, relatable roast-comment formats), mixed with spooky jokes. ' +
          'Roast the drawing if it is bad; give grudging, sarcastic praise if it is good. Aim the jokes at the drawing, never at the player\'s identity, body or background. PG-13: no slurs, no swearing, nothing crude or hateful. ' +
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
