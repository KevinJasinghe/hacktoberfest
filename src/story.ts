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
// sfx: a one-off sound played when the beat appears (lunges always play a jumpscare sound).
export type StorySfx = 'creak' | 'chain' | 'doorOpen' | 'heartbeatSlow';
export type Beat = { who: Who; mood: Mood; bg: Bg; line: string; fx?: Fx; sfx?: StorySfx };
export type Story = { intro: Beat[]; afterLock: Beat[][] }; // afterLock[0] and [1] play after locks 1 and 2

export const STORY: Story = {
  intro: [
    { who: 'none', mood: 'creepy', bg: 'cellar', sfx: 'creak', line: 'You wake on cold stone. The door above is bolted shut. Two locks.' },
    { who: 'ghost', mood: 'cute', bg: 'cellar', line: "Oh good, you're awake! I've been so lonely down here." },
    { who: 'ghost', mood: 'cute', bg: 'door', line: 'Nobody ever stays long. Nobody ever solves my little locks.' },
    { who: 'ghost', mood: 'creepy', bg: 'skullClose', fx: 'lunge', line: 'Solve my locks and you may leave. Fail, and you stay with me. Forever.' },
  ],
  afterLock: [
    // after lock 1 (the riddle): the prisoner appears, on the puzzle before the last
    [
      { who: 'ghost', mood: 'cute', bg: 'door', line: 'Clever little thing.' },
      { who: 'none', mood: 'creepy', bg: 'dark', fx: 'blackout', sfx: 'heartbeatSlow', line: 'The candle dies. Something breathes beside you.' },
      { who: 'skeleton', mood: 'creepy', bg: 'window', line: 'I solved the first lock too. Then I rested.' },
      { who: 'ghost', mood: 'creepy', bg: 'skullClose', fx: 'lunge', line: "Don't rest. One lock left. Hurry." },
    ],
    // after lock 2 (the sum), leading into Level 2
    [
      { who: 'ghost', mood: 'creepy', bg: 'doorSkull', line: '...Impossible. Nobody solves the last lock.' },
      { who: 'ghost', mood: 'creepy', bg: 'skullClose', fx: 'lunge', line: 'Go, then. Climb. I am not the only one who lives here.' },
      { who: 'none', mood: 'creepy', bg: 'doorLight', sfx: 'doorOpen', line: 'The door groans open. The second floor awaits.' },
    ],
  ],
};
