import { Pressable, Text, View } from 'react-native';
import DungeonBackground from './DungeonBackground';
import GameTitle from './GameTitle';
import { colors, ui } from './theme';

type Props = {
  name?: string | null;
  onStart: () => void;
  onLeaderboard?: () => void;
  onSignOut?: () => void;
  signOutLabel?: string;
};

export default function MenuScreen({ name, onStart, onLeaderboard, onSignOut, signOutLabel = 'Sign out' }: Props) {
  return (
    <View style={ui.center}>
      <DungeonBackground />
      <GameTitle />
      <Text style={[ui.dim, { color: colors.text, marginTop: 16, marginBottom: 32, textAlign: 'center', textShadowColor: '#000', textShadowRadius: 8 }]}>
        {name ? `${name}, you` : 'You'} wake in Gemma's dungeon. Three nights to escape. Something is watching.
      </Text>
      <Pressable style={[ui.button, { alignSelf: 'stretch' }]} onPress={onStart}>
        <Text style={ui.buttonText}>ENTER THE DUNGEON</Text>
      </Pressable>
      {onLeaderboard && (
        <Pressable style={[ui.buttonGhost, { alignSelf: 'stretch' }]} onPress={onLeaderboard}>
          <Text style={ui.buttonText}>LEADERBOARD</Text>
        </Pressable>
      )}
      {onSignOut && (
        <Pressable onPress={onSignOut}>
          <Text style={[ui.dim, { marginTop: 24 }]}>{signOutLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
