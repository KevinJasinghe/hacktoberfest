// Gemma 4 dungeon master, called through Google's Gemini API with plain fetch.
// Every wrapper falls back to src/mocks.ts if the call fails or returns bad JSON.
import { mocks } from './mocks';

const MODEL = 'gemma-4-26b-a4b-it';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const API_KEY = process.env.EXPO_PUBLIC_GEMMA_API_KEY ?? '';
const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === '1' || !API_KEY;
const TIMEOUT_MS = 15000;

const PERSONA =
  'You are the malevolent spirit haunting a house, acting as dungeon master in a horror escape game. ' +
  'You are cruel and theatrical but keep everything PG-13. ';

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

// Sends one prompt (plus an optional base64 JPEG) and returns the parsed JSON reply.
export async function ask(prompt: string, imageBase64?: string): Promise<unknown> {
  const parts: object[] = [{ text: PERSONA + prompt + '\nRespond with JSON only. No markdown, no prose.' }];
  if (imageBase64) parts.push({ inline_data: { mime_type: 'image/jpeg', data: imageBase64 } });
  const contents = [{ role: 'user', parts }];

  let res = await post({ contents, generationConfig: { temperature: 0.2, thinkingConfig: { thinkingLevel: 'MINIMAL' } } });
  // Retry once without thinkingConfig in case this model rejects it.
  if (res.status === 400) res = await post({ contents, generationConfig: { temperature: 0.2 } });
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
      const r = (await ask(
        `Create ${count} short puzzles the player must solve to escape the cellar. Mix riddles and simple mental-math word problems with a spooky theme. ` +
          'Each must be solvable in under 45 seconds with a one- or two-word answer (math answers are whole numbers). Double-check every answer. ' +
          'List every acceptable answer, lowercase. ' +
          `Format: {"puzzles":[{"type":"riddle"|"math","question":"...","answers":["..."]}]} with exactly ${count} items.`,
      )) as { puzzles?: unknown[] };
      const puzzles = (r.puzzles ?? []).map((p) => {
        const q = p as Record<string, unknown>;
        const answers = Array.isArray(q.answers) ? q.answers.map((a) => String(a).trim()).filter(Boolean) : [];
        if (!answers.length) throw new Error('puzzle without answers');
        return { type: q.type === 'math' ? 'math' : 'riddle', question: str(q.question, 'question'), answers } as Puzzle;
      });
      if (puzzles.length < count) throw new Error(`only ${puzzles.length} puzzles`);
      return puzzles.slice(0, count);
    },
    () => mocks.puzzles(count),
  );
}

export function drawingPrompt(): Promise<string> {
  return withFallback(
    'drawingPrompt',
    async () => {
      const r = (await ask(
        'Give the player one spooky thing to draw with their finger in under a minute. Keep it simple and recognizable (a few words). ' +
          'Format: {"prompt":"..."}',
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

export function pickObjects(count = 1): Promise<string[]> {
  return withFallback(
    'pickObjects',
    async () => {
      const r = (await ask(
        `Pick ${count} object${count === 1 ? '' : 's'} the player must find and photograph at an indoor Halloween gathering. ` +
          'It must be spooky or Halloween-themed AND common enough to actually be in the room, like a pumpkin or balloons. Other good picks: a candle, wrapped candy, a plastic spider, a paper bat. ' +
          'No rare props (no coffin, cauldron, grave, ouija board, or real skeleton). One or two words, lowercase. ' +
          `Format: {"objects":[${Array(count).fill('"..."').join(',')}]} with exactly ${count} item${count === 1 ? '' : 's'}.`,
      )) as { objects?: unknown[] };
      const objects = (r.objects ?? []).map((o) => str(o, 'object').toLowerCase());
      const unique = [...new Set(objects)];
      if (unique.length < count) throw new Error(`need ${count} distinct objects`);
      return unique.slice(0, count);
    },
    () => mocks.pickObjects(count),
  );
}

export function checkPhoto(imageBase64: string, objectName: string): Promise<PhotoCheck> {
  return withFallback(
    'checkPhoto',
    async () => {
      const r = (await ask(
        `The player was told to photograph ${objectName}. Does this photo clearly show it? ` +
          'Be fair: a real example counts even if it is partly visible, angled, or sharing the frame. ' +
          'Reject the wrong object, an empty room, and a picture of a screen. Add a one-sentence comment, taunting if they failed. ' +
          'Format: {"match":true|false,"comment":"..."}',
        imageBase64,
      )) as { match?: unknown; comment?: unknown };
      if (typeof r.match !== 'boolean') throw new Error('bad match');
      return { match: r.match, comment: typeof r.comment === 'string' ? r.comment : '' };
    },
    mocks.checkPhoto,
  );
}
