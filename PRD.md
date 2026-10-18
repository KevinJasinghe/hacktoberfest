# [Game Name TBD] PRD

> **Instructions for Claude Code:** Read this entire document before writing any code. Build only what is listed under MVP Features, in the order given in Build Order. Items marked **[TBD]** are not decided yet: do not decide them yourself, ask. Check the Open Decisions section before starting. This is a 5-hour hackathon build, so favor working and simple over complete.

## 0. Open Decisions (ask before building these parts)

1. **Game name:** [TBD]
2. **Sign-in method:** Firebase is the backend, with one login per user. Google sign-in was requested, but Expo's docs say Google sign-in can't run in Expo Go because it needs custom native code (a development build). The app must run in Expo Go. Ask which to keep before building sign-in.
3. **Gemma 4 API provider and endpoint:** [TBD]. The key will be provided. Confirm that the endpoint accepts image input, since Levels 2 and 3 send images.
4. **Demo plan:** to be written later.

## 1. Overview

- **Pitch:** A spooky iOS mobile game where you escape a haunted house, with Gemma 4 as the dungeon master. Gemma gives you puzzles to complete and objects to photograph to help you escape, and actively tries to sabotage you.
- **Game length:** 7-10 minutes total, across 3 levels with a hard time limit on each.
- **Event:** Hack the 6ix Hacktober
- **Main track:** Best Hallow-Hack (create a project that incites fear)
- **Sponsor track:** Best use of Gemma 4

## 2. Tech Stack and Constraints

| Area | Choice |
|------|--------|
| Platform | iOS |
| App | React Native with Expo, tested on an iPhone through Expo Go by scanning a QR code |
| AI dungeon master | Gemma 4 (provider [TBD], see Open Decisions) |
| Backend | Firebase: Authentication (one login per user) and Cloud Firestore (scores and leaderboard), using the Firebase JS SDK |
| Animations | Lottie (`lottie-react-native`), including loading skulls |
| Camera | Expo camera with overlays, including a jumpscare overlay on the selfie camera |
| Drawing | On-screen drawing canvas, exported as an image for Gemma to score |
| Audio | Scary background music and jumpscare sounds |
| Assets | Free music, sound effects and Lottie skull files. Use only assets whose license allows this use, and list each source in `CREDITS.md`. |

**Constraints**

- Everything must run in Expo Go. No library that needs a custom native build.
- Secrets go in `.env`, which is git-ignored. Commit a `.env.example` template only.

## 3. Project Structure

Propose a simple layout and keep it flat.

## 4. MVP Features and Acceptance Criteria

Each feature is done only when its acceptance criteria pass.

**If time runs short:** cut down Level 1 first (fewer or simpler puzzles). Keep Levels 2 and 3, jumpscares, scoring and the leaderboard.

### 4.1 Login

- Done when a player can log in through Firebase Authentication (method: see Open Decisions) and each run's times and score are saved to their account.

### 4.2 Three-level escape

- The player starts at the bottom of the dungeon and must clear Levels 1, 2 and 3 in order to escape.
- Every level has a hard timer. When it runs out, the level resets with a full timer, the player loses points (see Scoring) and a jumpscare plays.
- Done when a player can go from Level 1 to escaping after Level 3, and a timeout on any level resets that level with the penalty.

### 4.3 Level 1: Puzzles (time limit: 3:00)

- Gemma generates brain teasers and math puzzles, for example sudoku. Keep each puzzle short enough to fit the time limit (for example a 4x4 sudoku, not 9x9).
- Gemma generates as many puzzles as fit the 3-minute limit.
- No photo is needed. Solving the puzzles clears the level.
- Done when solving all of Gemma's puzzles within 3:00 clears the level.

### 4.4 Level 2: Creativity (time limit: 3:00)

- Gemma gives a spooky prompt to draw.
- The player draws on the screen and submits the drawing.
- Gemma scores the drawing out of 100. A score above 75 passes and clears the level.
- A score of 75 or below triggers a jumpscare and the player redraws. Redos are unlimited within the 3-minute limit.
- Done when a drawing scored above 75 clears the level, and a drawing scored 75 or below triggers a jumpscare and a redo.

### 4.5 Level 3: Camera hunt (time limit: 2:30 total)

- Gemma picks 2 objects for the player to find and photograph. Objects are spooky or escape themed, but things people typically have lying around.
- The player also has to take 1 selfie.
- Timers: 1:00 for each object and 0:30 for the selfie. If any item's timer runs out, Level 3 resets with the penalty.
- The selfie camera shows a jumpscare overlay. This is the only place the selfie overlay is used.
- Gemma checks each object photo to confirm it shows the requested object.
- Done when photos of both objects pass Gemma's check and the selfie is taken within their timers, which lets the player escape.

### 4.6 Jumpscares and Gemma sabotage

- Gemma sabotages the player with jumpscares, which hurt their score because the timer keeps running during them.
- Jumpscares use audio plus a pop-up.
- Jumpscares fire:
    - on every failure (level timeout, or a Level 2 drawing scored 75 or below)
    - 1-2 more times at random during each run
    - other moments are your call; keep them scary but don't block play
- Done when every failure triggers a jumpscare, and each run has 1-2 random jumpscares.

### 4.7 Scary music

- Done when scary music plays throughout the game.

### 4.8 Loading skulls

- Done when every loading state (including waiting on Gemma) shows a Lottie skull animation.

### 4.9 Speed scoring

- Faster levels earn more points. Failing to finish a level in time always costs points.
- Formula:
    - **Level points** = `round(1000 x seconds remaining / level time limit)`, minimum 100 for clearing the level. For Level 3, seconds remaining is the sum of the time left on each item's timer, and the limit is 150 seconds.
    - **Timeout penalty:** -250 points each time a level's timer runs out.
    - **Total score** = sum of level points minus penalties, floored at 0.
    - **Ties** on the leaderboard go to the faster total time.
- Done when a completed run produces a total score from this formula and saves it with the per-level times.

### 4.10 Public leaderboard

- Done when any logged-in player can see the top scores from all players, sorted by total score.

### Out of scope (do not build)

- Anything not listed above

## 5. User Flow

1. Player opens the app and logs in.
2. Player starts at the bottom of the dungeon in Level 1 and solves Gemma's puzzles before the 3-minute timer runs out.
3. Player moves up to Level 2 and draws Gemma's spooky prompt until Gemma scores it above 75, within 3 minutes.
4. Player moves up to Level 3 and photographs the 2 objects Gemma picks (1 minute each) and takes a selfie (30 seconds), with a jumpscare overlay on the selfie camera.
5. Player escapes. Their score is saved and shown on the public leaderboard.

Throughout the game: scary music plays, Gemma sabotages the player with jumpscares, timeouts reset the level with a point penalty, and 1-2 random jumpscares fire.

## 6. Data Model and API

### Firestore

- `users/{uid}`: display name, created at, best score
- `runs/{runId}`: uid, display name, time per level (seconds), points per level, number of timeouts, total score, total time, created at
- **Leaderboard:** query `runs` ordered by total score (highest first), then total time (fastest first), top 20

### Gemma 4 calls

Ask Gemma for JSON responses so the app can parse them.

| Call | Input | Output |
|------|-------|--------|
| Generate Level 1 puzzles | Number of puzzles, time limit | List of puzzles, each with its question, type and answer, so the app can check answers right away |
| Level 2 prompt | None | One spooky drawing prompt |
| Score drawing | Drawing image, prompt | Score from 0 to 100 |
| Pick Level 3 objects | None | 2 objects that are spooky or escape themed and commonly found at home |
| Check object photo | Photo, object name | Whether the photo shows the object |

## 7. Setup and Environment

- **Install:** create the project with `npx create-expo-app`.
- **Run:** `npx expo start`, then scan the QR code with the iPhone to open the app in Expo Go.
- **Environment variables:** create `.env.example` with the variables below and empty values, and add `.env` to `.gitignore`. The real key values will be provided.

```
EXPO_PUBLIC_GEMMA_API_KEY=
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

- **Note:** Expo inlines `EXPO_PUBLIC_` variables into the app bundle, so the Gemma key ships inside the app. That's acceptable for a hackathon demo. Rotate the key afterward.

## 8. Build Order

1. Scaffold the Expo project, add `.env.example` and `.gitignore`, and confirm the app opens on the iPhone by scanning the QR code.
2. Build the game shell: level progression, timers, timeout reset with penalty, and scoring, using mock Gemma responses.
3. Connect Gemma 4 and replace the mock responses.
4. Build Level 2 (drawing and scoring).
5. Build Level 3 (camera hunt and selfie overlay).
6. Add jumpscares, scary music and loading skulls.
7. Add Firebase login, saving runs, and the leaderboard.
8. Build Level 1. If time is short, keep it small (see section 4).
9. Polish the full run from login to leaderboard.

**Timing target:** core flow working by hour 3.5, bug fixes and polish by hour 4.5.

## 9. Rules for Claude Code

- Use only libraries that work in Expo Go. Ask before adding anything that needs a custom native build.
- Ask before adding any dependency not listed in section 2.
- Never commit `.env` or any key.
- Commit after each working step in the build order.
- If Gemma 4 fails or is rate limited, fall back to mock responses kept in one mock file.
- Keep code simple. Skip tests except for the scoring formula.
- Do not build anything that isn't listed under MVP Features.
- Do not decide [TBD] items or Open Decisions yourself. Ask.

## 10. Definition of Done

- A player can log in, clear all 3 levels, and see their score on the leaderboard.
- Timeouts reset the level, cost points, and trigger a jumpscare.
- The app opens on an iPhone by scanning the Expo Go QR code.
- A full run takes 7-10 minutes.
- No secrets are committed.
- Demo steps: to be added later.