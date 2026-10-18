import LottieView from 'lottie-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

export const SKULL = require('../assets/lottie/skull.json');

// Shown for every loading state, including every wait on Gemma.
export default function Loader({ text }: { text: string }) {
  return (
    <View style={styles.wrap}>
      <LottieView source={SKULL} autoPlay loop style={styles.skull} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  skull: { width: 120, height: 120 },
  text: { color: colors.dim, fontStyle: 'italic', marginTop: 8, textAlign: 'center' },
});
