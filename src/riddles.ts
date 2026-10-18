// Classic riddles with known answers. Gemma retells one spookily; answers always come from here,
// because riddles Gemma invents itself are often ambiguous.
export type Riddle = { question: string; answers: string[] };

export const RIDDLES: Riddle[] = [
  { question: 'The more of me you take, the more you leave behind. What am I?', answers: ['footsteps', 'steps'] },
  { question: 'I have keys but open no locks. What am I?', answers: ['piano', 'keyboard'] },
  { question: 'What has a face and two hands but no arms or legs?', answers: ['clock', 'watch'] },
  { question: 'I follow you all day but vanish in the dark. What am I?', answers: ['shadow'] },
  { question: 'I have many teeth but cannot bite. What am I?', answers: ['comb', 'zipper', 'saw'] },
  { question: 'What gets wetter the more it dries?', answers: ['towel'] },
  { question: 'What has an eye but cannot see?', answers: ['needle', 'storm', 'hurricane', 'potato'] },
  { question: 'I am always in front of you but cannot be seen. What am I?', answers: ['future', 'tomorrow'] },
  { question: 'What can you catch but not throw?', answers: ['cold', 'breath'] },
  { question: 'I grow when fed but die when given water. What am I?', answers: ['fire', 'flame'] },
  { question: 'What has a neck but no head?', answers: ['bottle'] },
  { question: 'What goes up but never comes down?', answers: ['age', 'your age'] },
  { question: 'What has to be broken before you can use it?', answers: ['egg'] },
  { question: 'I speak without a mouth and hear without ears. What am I?', answers: ['echo'] },
  { question: 'What has a head and a tail but no body?', answers: ['coin'] },
  { question: 'What is full of holes but still holds water?', answers: ['sponge'] },
];
