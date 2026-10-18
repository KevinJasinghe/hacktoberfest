import { ImageSourcePropType } from 'react-native';
import type { Mood, Who } from './story';

// Characters are hand-drawn; the door is pixel art upscaled 3x so it stays crisp (see CREDITS.md).
export const BACKGROUND = require('../assets/story/door.png');
export const BACKGROUND_SKULL = require('../assets/story/door-skull.png');

const SPRITES: Record<string, ImageSourcePropType> = {
  'ghost:cute': require('../assets/story/ghost-cute.png'),
  'ghost:creepy': require('../assets/story/ghost-creepy.png'),
  'skeleton:creepy': require('../assets/story/skeleton-creepy.png'),
};

// The narrator ('none') has no sprite.
export function spriteFor(who: Who, mood: Mood): ImageSourcePropType | null {
  return SPRITES[`${who}:${mood}`] ?? null;
}
