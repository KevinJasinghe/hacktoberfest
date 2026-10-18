import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import GameScreen, { RunResult } from './src/GameScreen';
import MenuScreen from './src/MenuScreen';
import ResultsScreen from './src/ResultsScreen';

type Screen = { name: 'menu' } | { name: 'game' } | { name: 'results'; result: RunResult };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'menu' });

  return (
    <>
      {screen.name === 'menu' && <MenuScreen onStart={() => setScreen({ name: 'game' })} />}
      {screen.name === 'game' && <GameScreen onFinish={(result) => setScreen({ name: 'results', result })} />}
      {screen.name === 'results' && <ResultsScreen result={screen.result} onDone={() => setScreen({ name: 'menu' })} />}
      <StatusBar style="light" />
    </>
  );
}
