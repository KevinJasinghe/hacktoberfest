import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import GameScreen, { RunResult } from './src/GameScreen';
import { JumpscareProvider } from './src/Jumpscare';
import MenuScreen from './src/MenuScreen';
import ResultsScreen from './src/ResultsScreen';

type Screen = { name: 'menu' } | { name: 'game' } | { name: 'results'; result: RunResult };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'menu' });
  const music = useAudioPlayer(require('./assets/audio/music.mp3'));

  // Scary music loops for the whole session, even with the iPhone's silent switch on.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
    music.loop = true;
    music.volume = 0.5;
    music.play();
  }, [music]);

  return (
    <JumpscareProvider>
      {screen.name === 'menu' && <MenuScreen onStart={() => setScreen({ name: 'game' })} />}
      {screen.name === 'game' && <GameScreen onFinish={(result) => setScreen({ name: 'results', result })} />}
      {screen.name === 'results' && <ResultsScreen result={screen.result} onDone={() => setScreen({ name: 'menu' })} />}
      <StatusBar style="light" />
    </JumpscareProvider>
  );
}
