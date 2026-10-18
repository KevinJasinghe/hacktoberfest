// Classic riddles with known answers. Gemma retells one spookily; answers always come from here,
// because riddles Gemma invents itself are often ambiguous.
export type Riddle = { question: string; answers: string[]; hint: string }; // hint: a nudge that never says the answer

export const RIDDLES: Riddle[] = [
  { question: 'The more of me you take, the more you leave behind. What am I?', answers: ['footsteps', 'steps'], hint: 'You make these every time you walk.' },
  { question: 'I have keys but open no locks. What am I?', answers: ['piano', 'keyboard'], hint: 'You press it to make music, or to type.' },
  { question: 'What has a face and two hands but no arms or legs?', answers: ['clock', 'watch'], hint: 'It tells you something you cannot hold.' },
  { question: 'I follow you all day but vanish in the dark. What am I?', answers: ['shadow'], hint: 'You cast it whenever light hits you.' },
  { question: 'I have many teeth but cannot bite. What am I?', answers: ['comb', 'zipper', 'saw'], hint: 'It is a tool with a row of little points.' },
  { question: 'What gets wetter the more it dries?', answers: ['towel'], hint: 'You use it after a bath.' },
  { question: 'What has an eye but cannot see?', answers: ['needle', 'storm', 'hurricane', 'potato'], hint: 'Think of sewing, or weather, or the kitchen.' },
  { question: 'I am always in front of you but cannot be seen. What am I?', answers: ['future', 'tomorrow'], hint: 'It has not happened yet.' },
  { question: 'What can you catch but not throw?', answers: ['cold', 'breath'], hint: 'You can catch it in winter, and it makes you sneeze.' },
  { question: 'I grow when fed but die when given water. What am I?', answers: ['fire', 'flame'], hint: 'It is hot, and it needs air to live.' },
  { question: 'What has a neck but no head?', answers: ['bottle'], hint: 'You pour from it, and it has a cap.' },
  { question: 'What goes up but never comes down?', answers: ['age', 'your age'], hint: 'Everyone has one, and it only ever goes one way.' },
  { question: 'What has to be broken before you can use it?', answers: ['egg'], hint: 'You crack it open for breakfast.' },
  { question: 'I speak without a mouth and hear without ears. What am I?', answers: ['echo'], hint: 'You hear it in canyons and empty halls.' },
  { question: 'What has a head and a tail but no body?', answers: ['coin'], hint: 'You can flip it to decide something.' },
  { question: 'What is full of holes but still holds water?', answers: ['sponge'], hint: 'You wash the dishes with it.' },
];
