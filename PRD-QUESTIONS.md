# PRD Questions

Questions to answer before planning the implementation. Where there's a suggested answer, it's listed under the question; reply "agree" to accept it.

## Open Decisions

1. **Game name:** do you have one, or should we use a placeholder until one is picked?
2. **Sign-in:** which method should we use instead of Google? Options that work in Expo Go:
   - **Email and password through Firebase.** Suggested: reliable and quick to build.
   - **Anonymous sign-in plus a display name.** Least friction, but the account is lost if the app is reinstalled.

   Either way, players need a display name for the leaderboard. Should it be entered at sign-up?
3. **Gemma 4 provider:** which provider, endpoint and model ID are we using (for example, Google AI Studio's Gemini API)? Has it been confirmed to accept image input?
4. **Demo plan:** this can wait, but it affects whether we need a fast "demo mode" (see question 7).

## Gameplay rules

5. **Does the timer pause while waiting on Gemma?** Scoring a drawing or checking a photo could take 3–10 seconds. Level 3 gives only 0:30 for the selfie and 1:00 per object, so that wait could cost real time.
   - Suggested: the timer keeps running during jumpscares, as the PRD says, but pauses while Gemma is thinking.
6. **What happens when a level resets?**
   - Level 1: same puzzles or new ones?
   - Level 2: same drawing prompt or a new one?
   - Level 3: same objects or new ones? Do objects already photographed have to be photographed again?
   - Suggested: new content each time for all three, except Level 3, where the player keeps the same objects but starts over.
7. **Run length:** the clean maximum is 8.5 minutes (3:00 + 3:00 + 2:30), but a fast player could finish in about 3. Is 7–10 minutes a hard rule or just an estimate?
8. **Level 1 puzzle count and types:**
   - "As many puzzles as fit" needs a number. Suggested: 3.
   - LLMs often produce sudoku grids that are invalid or have more than one solution, and a grid input screen adds build time. Suggested: short riddles and math questions with typed answers, plus a 4x4 sudoku that the app generates itself only if time allows.
   - Suggested: check answers loosely (ignore capitalization and spacing, and accept numbers written as words).
9. **Selfie:** is it checked by Gemma or just taken? Is it saved anywhere?
   - Suggested: not checked and not saved.
10. **Jumpscare length:** should the pop-up close on its own after about 1.5–2 seconds, or need a tap?
    - Suggested: it closes on its own.

## Data and leaderboard

11. **Leaderboard entries:** should it show every run (one player could fill the top 20) or each player's best run?
    - Suggested: best run per player, using the `best score` already in the `users` collection.
12. **Unfinished runs:** if a player quits partway, is the run saved?
    - Suggested: save only completed runs.
13. **Firebase setup:**
    - Is the Firebase project already created, with the chosen sign-in method and Firestore turned on?
    - Are open "test mode" security rules okay for the hackathon?

## Dependencies to approve

Rule 9 says to ask before adding any dependency not listed in section 2. These are the ones expected to be needed, all of which work in Expo Go:

- **`expo-camera`** for the camera.
- **`expo-audio`** for music and sound effects.
- **`firebase`** (the JS SDK) for login and Firestore.
- **`lottie-react-native`** for the skull animations.
- **`@shopify/react-native-skia`** for the drawing canvas and exporting it as an image. The alternative is `react-native-svg` plus `react-native-view-shot`.
- **`expo-image-manipulator`** to shrink photos before sending them to Gemma, which makes uploads faster and cheaper.
- **`@react-native-async-storage/async-storage`** to keep players logged in between app launches.

Are these approved?

## Assets

14. Are music, sound effects and Lottie skull files already available, or should suitable ones be found and listed in `CREDITS.md`? Downloads would need to be done by you, or fetching them approved.
