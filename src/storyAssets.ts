import { ImageSourcePropType } from 'react-native';
import type { Mood, Who } from './story';

// Characters are hand-drawn (see CREDITS.md). Backgrounds live in SceneBackground.tsx.
const SPRITES: Record<string, ImageSourcePropType> = {
  'ghost:cute': require('../assets/story/ghost-cute.png'),
  'ghost:creepy': require('../assets/story/ghost-creepy.png'),
  'skeleton:creepy': require('../assets/story/skeleton-creepy.png'),
};

// The narrator ('none') has no sprite.
export function spriteFor(who: Who, mood: Mood): ImageSourcePropType | null {
  return SPRITES[`${who}:${mood}`] ?? null;
}
