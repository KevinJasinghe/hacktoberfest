# Implementation Plan

How we're building the game described in [`PRD.md`](PRD.md). Read the PRD first, especially **section 0 (Decisions)**, which overrides anything later in the PRD that conflicts. [`PRD-QUESTIONS.md`](PRD-QUESTIONS.md) has the original questions behind those decisions.

**Event:** Hack the 6ix Hacktober. **Tracks:** Best Hallow-Hack and Best use of Gemma 4.
**Goal:** a full run from login → Level 1 → Level 2 → Level 3 → leaderboard, running in Expo Go on an iPhone.

## Status

| # | Step | Status |
|---|------|--------|
| 1 | Scaffold, install packages, confirm the app opens in Expo Go | Done (opens in Expo Go on SDK 57) |
| 2 | Game shell on mock responses | Built: menu → 3 placeholder levels → results, with timers, resets and scoring. **Needs a phone check** |
| 3 | Gemma client and mocks | Built (`src/gemma.ts`, `src/mocks.ts`). Real calls untested: **the key's AI Studio project has no credits (HTTP 402)**, so the app uses mocks for now |
| 4 | Level 2: drawing | Built: Skia finger drawing, Clear/Submit, Gemma score (mock for now), redraw on 75 or below. Jumpscare on failure comes in step 6. **Needs a phone check** |
| 5 | Level 3: camera hunt | Built: camera permission, 2 Gemma-picked objects (kept across resets), photo check (mock for now), selfie with a "BEHIND YOU" overlay. **Needs a phone check** |
| 6 | Jumpscares, music, loader | Built: jumpscare pop-up and sound on every timeout, failed drawing and failed photo, 1–2 random scares per run, looping music, Lottie skull loader. **Needs a phone check** |
| 7 | Firebase auth, saving runs, leaderboard | Built: email/password sign-up with display name, saved login, completed runs saved, best-run leaderboard. Untested: **needs the Firebase keys in `.env`**. Without them the app runs as a guest with no leaderboard |
| 8 | Level 1: puzzles | Built: 3 riddle/math puzzles from Gemma (mock for now), typed answers checked loosely, new puzzles on reset. Sudoku skipped for now. **Needs a phone check** |
| 9 | Polish the full run | Not started |

**Already done:**
- Expo SDK 57 (React Native 0.86, TypeScript) with all approved packages. Downgraded from 58 because the App Store Expo Go only supports 57 until the SDK 58 release lands.
- CC0 audio in `assets/audio/`.
- `src/scoring.ts` with tests.
- `.env.example`, with `.env` git-ignored.

Update this table as steps land.

## Open to-dos (blocking)

- [ ] **Skull animation (optional):** `assets/lottie/skull.json` is a simple hand-made skull. To use a nicer one, download a skull from https://lottiefiles.com/free-animations/skull as **Lottie JSON** (not dotLottie), overwrite that file, and update its row in `CREDITS.md`.
- [ ] **Firebase project:**
  1. Create the project.
  2. Under Authentication, turn on **Email/Password**.
  3. Create a **Firestore** database in **test mode**.
  4. Add a **Web app** and copy its config into the `EXPO_PUBLIC_FIREBASE_*` keys in `.env`.
- [ ] **Gemma billing:** the key returns HTTP 402 "prepayment credits are depleted". Add credits at https://ai.studio/projects, or use a key from a project without prepaid billing. Then run `node --env-file=.env scripts/gemma-smoke.mjs` and check that both requests return JSON.
- [ ] **Demo plan:** to be written later (PRD section 10).

## Setup (for anyone on the team)

1. `git clone` the repo, then run `npm ci`. After pulling changes to `package-lock.json`, run `npm ci` again so `node_modules` matches.
2. `cp .env.example .env` and fill in the keys. Get the values from a teammate; **never commit `.env`**.
3. Start the dev server:
   - **Mac, or Windows without WSL:** run `npx expo start` and scan the QR code with the iPhone camera.
   - **WSL2:** the default network mode hides the dev server from the phone. Log in once with `npx expo login` (in a normal terminal, since it prompts), then run `npx expo start --tunnel`.
   - **Venue Wi-Fi** often blocks phone-to-laptop traffic, so use `--tunnel` there too.
4. The phone needs the latest **Expo Go** from the App Store, which must support SDK 57.

**Useful commands:**

| Command | What it does |
|---------|--------------|
| `node --test src/scoring.test.ts` | Runs the scoring tests (Node 22.6+; no test package needed) |
| `node --env-file=.env scripts/gemma-smoke.mjs` | Sends one text and one image request to Gemma to check the key |
| `npx tsc --noEmit` | Type check (test files are excluded) |
| `npx expo-doctor` | Checks dependency health |
| `npx expo install <pkg>` | Adds a package at the version that matches SDK 57. Use this, not `npm install <pkg>` |

## Rules (from the PRD)

- **Expo Go only.** No library that needs a custom native build.
- **Packages:**
  - The approved list is `expo-camera`, `expo-audio`, `expo-image-manipulator`, `lottie-react-native`, `@shopify/react-native-skia`, `@react-native-async-storage/async-storage` and `firebase`, plus `expo-asset`, which `expo-audio` requires.
  - Ask the team before adding anything else.
  - Expo SDK 57 APIs differ from older tutorials, so check https://docs.expo.dev/versions/v57.0.0/.
- **Gemma failures:** if Gemma fails or is rate limited, fall back to the mock responses in `src/mocks.ts`.
- **Tests:** only for the scoring formula.
- **Commits:** commit after each working step. Run `git status` first and make sure `.env` isn't staged.
- **Scope:** don't build anything outside PRD section 4. If time runs short, cut Level 1 first.

## Key technical choices

### Navigation
No router library. `App.tsx` holds a `screen` state (`auth | menu | game | results | leaderboard`) and switches between screens.

### Timer
- `useCountdown(limitSec, { paused })` is based on timestamps and ticks every 250 ms.
- It **pauses while waiting on Gemma** and **keeps running during jumpscares**.
- Each level adds up its "time spent" from timer time, which excludes Gemma waits. That time is what gets saved and used to break ties.

### Gemma (`src/gemma.ts`)
- Calls Google's Gemini API with plain `fetch`. The `@google/genai` package isn't used: it's not on the approved list, and it targets Node and browsers.
- `POST https://generativelanguage.googleapis.com/v1beta/models/gemma-4-26b-a4b-it:generateContent`
  - Header: `x-goog-api-key: EXPO_PUBLIC_GEMMA_API_KEY`.
  - Settings: temperature 0.2 and minimal thinking. No Google Search tool and no streaming.
- Images are sent inline as base64 JPEG parts.
- **JSON:** prompts ask for JSON only. The response is parsed after stripping any code fences. We couldn't confirm that the model supports Gemini's built-in JSON mode, so the prompt and parser handle it instead.
- **Five wrappers, matching PRD section 6:**
  - `generatePuzzles(3)`
  - `drawingPrompt()`
  - `scoreDrawing(img, prompt)`
  - `pickObjects()`
  - `checkPhoto(img, name)`
- **Fallback:** every wrapper falls back to `src/mocks.ts` on an error, rate limit, timeout (about 15 s) or bad JSON. Setting `EXPO_PUBLIC_USE_MOCKS=1` in `.env` forces mocks.

### Images
- **Drawings:** Skia `makeImageSnapshot().encodeToBase64()`.
- **Photos:** `CameraView.takePictureAsync()`, then `expo-image-manipulator` resizes to about 512 px wide and saves as JPEG at 0.6 quality with base64: `ImageManipulator.manipulate(uri).resize({ width: 512 })`, then `renderAsync()`, then `saveAsync({ format: SaveFormat.JPEG, compress: 0.6, base64: true })`.
  - `manipulateAsync` is deprecated in newer SDKs, so don't use it.

### Firebase (`src/firebase.ts`)
- The JS SDK (v13). Auth uses `initializeAuth` + `getReactNativePersistence(AsyncStorage)`, so players stay logged in.
- **Collections:**
  - `users/{uid}`: `displayName, createdAt, bestScore, bestTime, bestRunId`
  - `runs/{runId}`: `uid, displayName, levelTimes[3], levelPoints[3], timeouts, totalScore, totalTime, createdAt`
- **Saving:** only completed runs are saved. On finish, `addDoc` to `runs`, then update `users/{uid}` if the run beats the stored best: a higher score, or an equal score with a faster time.
- **Leaderboard:** shows each player's best run. Query `users` ordered by `bestScore` descending, limit 50, then sort ties by `bestTime` in the app and show the top 20. This avoids a composite index.

### Other modules
- **Scoring (`src/scoring.ts`, done):**
  - `levelPoints(secondsRemaining, limit)`: `round(1000 × remaining / limit)`, minimum 100.
  - `totalScore(points, timeouts)`: −250 per timeout, floored at 0.
  - `compareRuns`: sorts by score, with ties going to the faster time.
- **Answer checking (`src/answers.ts`):** lowercase, collapse whitespace and punctuation, and map number words 0–20 to digits before comparing.
- **Jumpscares (`src/Jumpscare.tsx`):**
  - A context provider with `scare()`.
  - Shows a full-screen pop-up (red flash, a big skull and a shaking "GET OUT" message) and plays a random `assets/audio/scare-*.wav`. It closes on its own after about 1.8 s.
  - **When it fires:**
    - every timeout
    - every drawing scored 75 or below
    - every failed photo check
    - 1–2 random times per run: the time offsets are drawn at the start of the run, and they only fire while a timer is running
- **Music:** `expo-audio` loops `assets/audio/music.mp3` from the start of the run, with `setAudioModeAsync({ playsInSilentMode: true })`.
- **Loader (`src/Loader.tsx`):** the Lottie skull plus a creepy line of text, used for **every** loading state.

## File layout (flat)

```
App.tsx              screen switcher + providers (Jumpscare, music)
src/firebase.ts      init, signUp/signIn, saveRun, getLeaderboard
src/gemma.ts         ask() + 5 wrappers with mock fallback
src/mocks.ts         all mock responses
src/scoring.ts       scoring formula (done) + scoring.test.ts
src/answers.ts       loose answer matching
src/useCountdown.ts  pausable timer hook
src/Jumpscare.tsx    provider, pop-up, random scheduler
src/Loader.tsx       Lottie skull loader
src/TimerBar.tsx     shared countdown display
src/AuthScreen.tsx   email/password sign-up (with display name) and sign-in
src/MenuScreen.tsx   start run / leaderboard
src/GameScreen.tsx   runs levels 1→3, tracks times/points/timeouts
src/Level1.tsx  src/Level2.tsx  src/Level3.tsx
src/sudoku.ts  src/SudokuBoard.tsx  src/NumberPad.tsx  src/Typewriter.tsx  src/ClosingWalls.tsx   Level 1 pieces
src/ResultsScreen.tsx  src/LeaderboardScreen.tsx
assets/audio/*       CC0 music and sound effects (see CREDITS.md)
assets/lottie/skull.json
```

## Level behavior

### Level 1: the cellar door (3:00)
- A door with three padlocks; each solved puzzle opens one (ghost sound). Gemma's spirit taunts you with typed-out lines (intro, wrong answer, lock opens).
- **Lock 1, riddle** (Gemma, typed answer) and **Lock 2, math puzzle** (Gemma, on-screen number pad). The timer is paused while loading.
- **Lock 3, 4x4 sudoku** generated by the app (`src/sudoku.ts`, always one solution): tap a cell, then a digit.
- **Hint button** costs 15 s: a Gemma hint for locks 1-2, one revealed cell for the sudoku.
- A wrong answer shakes the input and flashes red. A dark "closing walls" frame (`src/ClosingWalls.tsx`) tightens and flickers over the last 60 s.
- **Timeout:** jumpscare, −250, and a fresh riddle, math puzzle and sudoku.

### Level 2: drawing (3:00)
- Gemma gives a spooky drawing prompt.
- The player draws on the Skia canvas, with Clear and Submit buttons.
- On Submit, Gemma scores the drawing. The timer pauses and the loader shows.
- **Score above 75:** clears the level.
- **75 or below:** jumpscare, and the canvas clears for a redraw. Redos are unlimited.
- **Timeout:** jumpscare, −250, and a new prompt.

### Level 3: camera hunt (1:00 + 1:00 + 0:30)
- Gemma picks 2 everyday spooky or escape-themed objects, once per run.
- **Each object step:** back camera, then Snap, then a Gemma check (timer paused). A pass moves on; a fail means a jumpscare and a retake.
- **Selfie step:** front camera with a jumpscare overlay (a skull or face fades in at a random moment). Taking the photo completes the step; it isn't checked or saved.
- **Any timeout:** jumpscare, −250, and a restart from object 1 with the **same objects**.
- **Level points:** the time left on all three item timers, summed, out of 150.

## Build order (commit after each step)

1. Scaffold the app, install the approved packages, and confirm it opens in Expo Go.
2. **Game shell:** `GameScreen`, `useCountdown`, `TimerBar`, scoring, placeholder levels with "win" and "wait for timeout" buttons, and `ResultsScreen`. All on mocks.
3. `gemma.ts` and `mocks.ts`. Smoke-test one text and one image request once the key is in `.env`.
4. Level 2 (Skia drawing and scoring).
5. Level 3 (camera hunt and selfie overlay).
6. Jumpscares, music and the loader.
7. Firebase auth, saving runs and the leaderboard.
8. Level 1. Keep it small if time is short.
9. Polish the full run from login to leaderboard.

**Timing target:** the core flow working by hour 3.5, and bug fixes and polish done by hour 4.5.

## Verification

- `node --test src/scoring.test.ts` passes. It covers fast and slow clears, the 100 minimum, the Level 3 sum, penalties, the 0 floor and tie-breaking.
- `npx tsc --noEmit` passes after each step.
- **Gemma smoke test:** one text prompt and one small image return JSON that parses.
- **On the iPhone:**
  - [ ] Sign up and complete a full run.
  - [ ] Let a level time out: it resets, costs 250 and plays a jumpscare.
  - [ ] Submit a bad drawing: jumpscare, then a redraw.
  - [ ] The selfie overlay appears.
  - [ ] Finish the run: the score is on the leaderboard, and a second account sees it too.
  - [ ] A full run takes roughly 7–10 minutes. This is an estimate, not a hard rule.
- **Before every commit:** `.env` isn't staged.
