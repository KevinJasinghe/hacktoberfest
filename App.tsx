import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import AuthScreen from './src/AuthScreen';
import { auth, firebaseEnabled } from './src/firebase';
import GameScreen, { RunResult } from './src/GameScreen';
import { JumpscareProvider } from './src/Jumpscare';
import LeaderboardScreen from './src/LeaderboardScreen';
import Loader from './src/Loader';
import MenuScreen from './src/MenuScreen';
import ResultsScreen from './src/ResultsScreen';
import { ui } from './src/theme';

type Screen = { name: 'menu' } | { name: 'game' } | { name: 'results'; result: RunResult } | { name: 'leaderboard' };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'menu' });
  // undefined = still checking for a saved login
  const [user, setUser] = useState<User | null | undefined>(firebaseEnabled ? undefined : null);
  const music = useAudioPlayer(require('./assets/audio/music.mp3'));

  // Scary music loops for the whole session, even with the iPhone's silent switch on.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
    music.loop = true;
    music.volume = 0.5;
    music.play();
  }, [music]);

  useEffect(() => (auth ? onAuthStateChanged(auth, setUser) : undefined), []);

  const menu = () => setScreen({ name: 'menu' });

  let content;
  if (user === undefined) content = <View style={ui.center}><Loader text="The house remembers you..." /></View>;
  else if (firebaseEnabled && !user) content = <AuthScreen />;
  else if (screen.name === 'game') content = <GameScreen onFinish={(result) => setScreen({ name: 'results', result })} />;
  else if (screen.name === 'results') content = <ResultsScreen result={screen.result} user={user} onDone={menu} />;
  else if (screen.name === 'leaderboard') content = <LeaderboardScreen uid={user?.uid} onBack={menu} />;
  else
    content = (
      <MenuScreen
        name={user?.displayName}
        onStart={() => setScreen({ name: 'game' })}
        onLeaderboard={firebaseEnabled ? () => setScreen({ name: 'leaderboard' }) : undefined}
        onSignOut={auth ? () => signOut(auth!) : undefined}
      />
    );

  return (
    <JumpscareProvider>
      {content}
      <StatusBar style="light" />
    </JumpscareProvider>
  );
}
