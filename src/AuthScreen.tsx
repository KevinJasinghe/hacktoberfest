import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import DungeonBackground from './DungeonBackground';
import { authErrorMessage, signIn, signUp } from './firebase';
import GameTitle from './GameTitle';
import Loader from './Loader';
import { colors, ui } from './theme';

// Email/password sign-up (with a display name for the leaderboard) and log-in.
// `onSkip` (development builds only) lets you play as a guest: runs are not saved.
export default function AuthScreen({ onSkip }: { onSkip?: () => void }) {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (mode === 'signup' && !name.trim()) return setError('Tell the spirit your name.');
    setBusy(true);
    setError('');
    try {
      if (mode === 'signup') await signUp(email, password, name.trim().slice(0, 20));
      else await signIn(email, password);
      // App switches screens when Firebase reports the signed-in user.
    } catch (e) {
      setError(authErrorMessage(e));
      setBusy(false);
    }
  };

  if (busy) return <Loader text="Opening the door..." />;

  return (
    <KeyboardAvoidingView behavior="padding" style={ui.center}>
      <DungeonBackground />
      <GameTitle />
      <Text style={[ui.dim, { marginTop: 8, marginBottom: 24 }]}>{mode === 'signup' ? 'Sign your name in the guest book.' : 'Welcome back. We missed you.'}</Text>
      {mode === 'signup' && (
        <TextInput style={styles.input} placeholder="Display name" placeholderTextColor={colors.dim} value={name} onChangeText={setName} maxLength={20} />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.dim}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <TextInput
        style={styles.input}
        placeholder="Password (6+ characters)"
        placeholderTextColor={colors.dim}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        onSubmitEditing={submit}
      />
      {!!error && <Text style={[ui.body, { color: colors.bloodBright, marginTop: 4 }]}>{error}</Text>}
      <Pressable style={[ui.button, styles.wide]} onPress={submit}>
        <Text style={ui.buttonText}>{mode === 'signup' ? 'SIGN UP' : 'LOG IN'}</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          setMode(mode === 'signup' ? 'login' : 'signup');
          setError('');
        }}
      >
        <Text style={[ui.dim, { marginTop: 16 }]}>{mode === 'signup' ? 'Already have an account? Log in' : 'New here? Sign up'}</Text>
      </Pressable>
      {onSkip && (
        <Pressable style={[ui.buttonGhost, styles.wide, { marginTop: 28 }]} onPress={onSkip}>
          <Text style={ui.buttonText}>SKIP FOR NOW</Text>
        </Pressable>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  input: {
    alignSelf: 'stretch', borderWidth: 1, borderColor: colors.blood, borderRadius: 8, color: colors.text,
    fontSize: 17, padding: 14, marginBottom: 10, backgroundColor: colors.panel,
  },
  wide: { alignSelf: 'stretch' },
});
