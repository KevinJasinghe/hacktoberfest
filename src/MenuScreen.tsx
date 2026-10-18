import { Pressable, Text, View } from 'react-native';
import { ui } from './theme';

export default function MenuScreen({ onStart }: { onStart: () => void }) {
  return (
    <View style={ui.center}>
      <Text style={ui.title}>HAUNTED ESCAPE</Text>
      <Text style={[ui.dim, { marginTop: 12, marginBottom: 32, textAlign: 'center' }]}>
        You wake at the bottom of the house. Three floors. Something is watching.
      </Text>
      <Pressable style={ui.button} onPress={onStart}>
        <Text style={ui.buttonText}>ENTER THE HOUSE</Text>
      </Pressable>
    </View>
  );
}
