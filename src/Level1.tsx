import DevLevel from './DevLevel';
import { LevelProps } from './levels';
import { LEVEL_LIMITS } from './scoring';

export default function Level1(props: LevelProps) {
  return <DevLevel title="Level 1 · The Cellar" limit={LEVEL_LIMITS[1]} {...props} />;
}
