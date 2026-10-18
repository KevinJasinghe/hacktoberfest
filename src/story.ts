// Level 1's story, told in cutscenes: an intro and two "between locks" scenes.
// The story is a fixed set of blocks (counts and moods are predefined) so Gemma can generate
// the same shape later: ask(STORY_PROMPT), then parseStory(), with STORY as the fallback.
export type Who = 'ghost' | 'skeleton' | 'none';
export type Mood = 'cute' | 'creepy';
export type Beat = { who: Who; mood: Mood; line: string };
export type Story = { intro: Beat[]; afterLock: Beat[][] }; // afterLock[0] after lock 1, afterLock[1] after lock 2

export const INTRO_BEATS = 3;
export const AFTER_LOCK_BEATS = 2;
export const MAX_LINE = 110;

export const STORY: Story = {
  intro: [
    { who: 'none', mood: 'creepy', line: 'You wake on cold stone. The door above is bolted shut. Three locks.' },
    { who: 'ghost', mood: 'cute', line: "Oh good, you're awake! I've been so lonely down here." },
    { who: 'ghost', mood: 'creepy', line: 'Solve my locks and you may leave. Fail, and you stay with me. Forever.' },
  ],
  afterLock: [
    [
      { who: 'ghost', mood: 'cute', line: 'Clever little thing. The first lock was a gift.' },
      { who: 'ghost', mood: 'creepy', line: 'The second will not be so kind.' },
    ],
    [
      { who: 'skeleton', mood: 'creepy', line: 'He tried to leave too. He solved the second lock as well.' },
      { who: 'ghost', mood: 'creepy', line: 'One lock left. Do you hear them breathing?' },
    ],
  ],
};

// Ready-made instruction for Gemma that produces exactly the shape parseStory() accepts.
export const STORY_PROMPT =
  'Write a short horror story told in 7 beats for a player locked in your cellar behind a door with three locks. ' +
  `Each beat is {"who":"ghost"|"skeleton"|"none","mood":"cute"|"creepy","line":"..."}; each line is one sentence of at most ${MAX_LINE} characters. ` +
  '"none" is a narrator describing the scene; "ghost" is you, the spirit; "skeleton" is a previous prisoner and is always creepy. ' +
  `Block "intro" has exactly ${INTRO_BEATS} beats played before the first lock: start with the narrator waking the player, then a friendly (cute) ghost, then a threatening (creepy) one. ` +
  `"afterLock" is two blocks of exactly ${AFTER_LOCK_BEATS} beats each, played after the first and second lock: the story escalates, the ghost turns from cute to creepy, and the second block hints at what happened to earlier prisoners. ` +
  'Keep it PG-13. Format: {"intro":[beat,beat,beat],"afterLock":[[beat,beat],[beat,beat]]}';

const WHO: Who[] = ['ghost', 'skeleton', 'none'];
const MOODS: Mood[] = ['cute', 'creepy'];

function parseBeat(raw: unknown): Beat {
  const b = raw as Record<string, unknown>;
  if (!WHO.includes(b?.who as Who)) throw new Error('bad who');
  if (!MOODS.includes(b?.mood as Mood)) throw new Error('bad mood');
  const line = typeof b.line === 'string' ? b.line.trim() : '';
  if (!line || line.length > MAX_LINE) throw new Error('bad line length');
  // Only a creepy skeleton sprite exists.
  return { who: b.who as Who, mood: b.who === 'skeleton' ? 'creepy' : (b.mood as Mood), line };
}

function parseBlock(raw: unknown, count: number): Beat[] {
  if (!Array.isArray(raw) || raw.length !== count) throw new Error(`block needs ${count} beats`);
  return raw.map(parseBeat);
}

// Validates a Gemma reply; throws on any deviation so the caller can fall back to STORY.
export function parseStory(raw: unknown): Story {
  const r = raw as { intro?: unknown; afterLock?: unknown };
  if (!Array.isArray(r?.afterLock) || r.afterLock.length !== 2) throw new Error('afterLock needs 2 blocks');
  return {
    intro: parseBlock(r.intro, INTRO_BEATS),
    afterLock: r.afterLock.map((block) => parseBlock(block, AFTER_LOCK_BEATS)),
  };
}
