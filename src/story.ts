// Level 1's story, told in cutscenes: an intro, then a scene after each lock. It is fixed on purpose,
// so every line can be paired with a specific character, mood, backdrop and effect.
export type Who = 'ghost' | 'skeleton' | 'none';
export type Mood = 'cute' | 'creepy';
// fx: 'lunge' throws the character at the camera; 'blackout' drops the room into darkness.
export type Fx = 'lunge' | 'blackout';
// Backdrops (drawn in SceneBackground.tsx): cellar = brick walls, door = the bolted doorway,
// doorSkull = the same with a skull on the lintel, skullClose = zoomed in on that skull, floor = the
// flagstones, window = a barred window onto the night, dark = near total darkness,
// doorLight = the door open, warm light spilling in.
export type Bg = 'cellar' | 'door' | 'doorSkull' | 'skullClose' | 'floor' | 'window' | 'dark' | 'doorLight';
export type Beat = { who: Who; mood: Mood; bg: Bg; line: string; fx?: Fx };
export type Story = { intro: Beat[]; afterLock: Beat[][] }; // afterLock[0..2] play after locks 1, 2 and 3

export const STORY: Story = {
  intro: [
    { who: 'none', mood: 'creepy', bg: 'cellar', line: 'You wake on cold stone. The door above is bolted shut. Three locks.' },
    { who: 'ghost', mood: 'cute', bg: 'cellar', line: "Oh good, you're awake! I've been so lonely down here." },
    { who: 'ghost', mood: 'cute', bg: 'door', line: 'Nobody ever stays long. Nobody ever solves my little locks.' },
    { who: 'ghost', mood: 'creepy', bg: 'skullClose', fx: 'lunge', line: 'Solve my locks and you may leave. Fail, and you stay with me. Forever.' },
  ],
  afterLock: [
    // after lock 1 (the riddle)
    [
      { who: 'ghost', mood: 'cute', bg: 'door', line: 'Clever little thing. The first lock was a gift.' },
      { who: 'none', mood: 'creepy', bg: 'floor', line: 'Somewhere in the dark, a chain drags across the stone.' },
      { who: 'ghost', mood: 'creepy', bg: 'doorSkull', line: 'The second will not be so kind.' },
    ],
    // after lock 2 (the sum)
    [
      { who: 'none', mood: 'creepy', bg: 'dark', fx: 'blackout', line: 'The candle gutters out. In the dark, something breathes beside you.' },
      { who: 'skeleton', mood: 'creepy', bg: 'window', line: 'I solved the second lock too. Then I stopped to rest.' },
      { who: 'ghost', mood: 'creepy', bg: 'skullClose', fx: 'lunge', line: "Don't rest. One lock left. Hurry, little mouse." },
    ],
    // after lock 3 (the grid), leading into Level 2
    [
      { who: 'ghost', mood: 'creepy', bg: 'doorSkull', line: "...No. That's not possible. Nobody solves the third lock." },
      { who: 'ghost', mood: 'creepy', bg: 'skullClose', fx: 'lunge', line: 'Go, then. Climb. The house is tall, and I am not the only one who lives here.' },
      { who: 'none', mood: 'creepy', bg: 'doorLight', line: 'The door groans open. Above you, the second floor is waiting.' },
    ],
  ],
};
