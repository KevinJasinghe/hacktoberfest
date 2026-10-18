import { Pressable, Text, View } from 'react-native';
import { ui } from './theme';

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
      <Text style={ui.title}>HAUNTED ESCAPE</Text>
      <Text style={[ui.dim, { marginTop: 12, marginBottom: 32, textAlign: 'center' }]}>
        {name ? `${name}, you` : 'You'} wake at the bottom of the house. Three floors. Something is watching.
      </Text>
      <Pressable style={[ui.button, { alignSelf: 'stretch' }]} onPress={onStart}>
        <Text style={ui.buttonText}>ENTER THE HOUSE</Text>
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
