import { ImageBackground, StyleSheet, View } from 'react-native';

// Tiled brick wall behind Level 1, darkened so text and the sudoku panel stay readable.
export default function CellarBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <ImageBackground source={require('../assets/images/cellar-wall.jpg')} resizeMode="repeat" style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, styles.tint]} />
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  tint: { backgroundColor: 'rgba(18,0,0,0.78)' },
});
