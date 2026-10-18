import DevLevel from './DevLevel';
import { LevelProps } from './levels';
import { LEVEL_LIMITS } from './scoring';

export default function Level2(props: LevelProps) {
  return <DevLevel title="Level 2 · The Nursery" limit={LEVEL_LIMITS[2]} {...props} />;
}
