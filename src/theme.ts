import { StyleSheet } from 'react-native';

export const colors = {
  bg: '#050505',
  panel: '#140808',
  blood: '#b30000',
  bloodBright: '#ff1a1a',
  text: '#e8e0d8',
  dim: '#8a7f78',
};

export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 20, paddingTop: 64 },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { color: colors.blood, fontSize: 34, fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  heading: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 8 },
  body: { color: colors.text, fontSize: 16, lineHeight: 22 },
  dim: { color: colors.dim, fontSize: 14, fontStyle: 'italic' },
  button: { backgroundColor: colors.blood, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  buttonGhost: { borderColor: colors.blood, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 1 },
});
