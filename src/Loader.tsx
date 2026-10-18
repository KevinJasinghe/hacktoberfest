import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

// Shown for every loading state. The Lottie skull replaces the spinner in step 6.
export default function Loader({ text }: { text: string }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={colors.blood} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { color: colors.dim, fontStyle: 'italic', marginTop: 12, textAlign: 'center' },
});
