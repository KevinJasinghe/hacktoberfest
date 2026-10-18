import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Haunted Escape</Text>
      <Text style={styles.sub}>The house is waiting...</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#b30000', fontSize: 36, fontWeight: '900', letterSpacing: 2 },
  sub: { color: '#888', marginTop: 12, fontStyle: 'italic' },
});
