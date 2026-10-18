// Checks the Gemma key with one text and one image request.
// Run with: node --env-file=.env scripts/gemma-smoke.mjs
import { readFileSync } from 'node:fs';

const key = process.env.EXPO_PUBLIC_GEMMA_API_KEY;
if (!key) throw new Error('EXPO_PUBLIC_GEMMA_API_KEY is empty in .env');
const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemma-4-26b-a4b-it:generateContent';

async function ask(label, parts) {
  const started = Date.now();
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature: 0.2, thinkingConfig: { thinkingLevel: 'MINIMAL' } },
    }),
  });
  const body = await res.json();
  const text = (body?.candidates?.[0]?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text).join('');
  console.log(`\n[${label}] HTTP ${res.status} in ${Date.now() - started} ms`);
  if (!res.ok) return console.log(body.error?.message ?? body);
  console.log(text);
  try {
    JSON.parse(text.replace(/```(?:json)?/gi, '').trim());
    console.log('→ parses as JSON');
  } catch {
    console.log('→ NOT plain JSON (the app strips fences and extracts the object, so check it looks sane)');
  }
}

await ask('text', [{ text: 'Respond with JSON only: {"prompt":"<one short spooky thing to draw>"}' }]);
await ask('image', [
  { text: 'Describe this image. Respond with JSON only: {"description":"...","isAppIcon":true|false}' },
  { inline_data: { mime_type: 'image/png', data: readFileSync(new URL('../assets/icon.png', import.meta.url)).toString('base64') } },
]);
