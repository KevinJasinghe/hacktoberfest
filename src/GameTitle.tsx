import { StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

// The game's name, shown on the login and menu screens.
export default function GameTitle() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.top}>3 NIGHTS</Text>
      <Text style={styles.main} numberOfLines={1} adjustsFontSizeToFit>
        AT GEMMA'S
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', alignSelf: 'stretch' },
  top: {
    color: colors.bloodBright, fontSize: 26, fontWeight: '900', letterSpacing: 10,
    textShadowColor: '#000', textShadowRadius: 10, textShadowOffset: { width: 0, height: 2 },
  },
  main: {
    color: colors.bloodBright, fontSize: 48, fontWeight: '900', letterSpacing: 2, textAlign: 'center',
    textShadowColor: '#000', textShadowRadius: 14, textShadowOffset: { width: 0, height: 3 },
  },
});
