import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { createContext, ReactNode, useContext, useEffect, useRef } from 'react';

// Music: one track plays at a time and crossfades into the next.
//   main    = the horror loop (menu, leaderboard, Levels 2 and 3)
//   tense   = Level 1 while you solve puzzles
//   dungeon = Level 1 story scenes
export type Track = 'main' | 'tense' | 'dungeon';
// Sound effects (the jumpscare sounds live in Jumpscare.tsx).
export type SfxName = 'keeper' | 'turn' | 'prisoner' | 'lockOpen' | 'wrong' | 'hint' | 'creak' | 'doorOpen' | 'chain' | 'heartbeat' | 'heartbeatSlow' | 'place';

const TRACK_VOLUME: Record<Track, number> = { main: 0.5, tense: 0.5, dungeon: 0.55 };
const FADE_OUT_MS = 700;
const FADE_IN_MS = 1200;
const STEP_MS = 50;

type Player = ReturnType<typeof useAudioPlayer>;
type Audio = { music: (track: Track) => void; sfx: (name: SfxName, volume?: number) => void };

const Ctx = createContext<Audio>({ music: () => {}, sfx: () => {} });
export const useAudio = () => useContext(Ctx);

// Players are created once, in a fixed order, as hooks require.
export function AudioProvider({ children }: { children: ReactNode }) {
  const tracks: Record<Track, Player> = {
    main: useAudioPlayer(require('../assets/audio/music.mp3')),
    tense: useAudioPlayer(require('../assets/audio/tense.mp3')),
    dungeon: useAudioPlayer(require('../assets/audio/dungeon.mp3')),
  };
  const sounds: Record<SfxName, Player> = {
    lockOpen: useAudioPlayer(require('../assets/audio/sfx-lock-open.mp3')),
    wrong: useAudioPlayer(require('../assets/audio/sfx-wrong.mp3')),
    hint: useAudioPlayer(require('../assets/audio/sfx-hint.mp3')),
    creak: useAudioPlayer(require('../assets/audio/sfx-creak.mp3')),
    doorOpen: useAudioPlayer(require('../assets/audio/sfx-door-open.mp3')),
    chain: useAudioPlayer(require('../assets/audio/sfx-chain.mp3')),
    heartbeat: useAudioPlayer(require('../assets/audio/sfx-heartbeat.mp3')),
    heartbeatSlow: useAudioPlayer(require('../assets/audio/sfx-heartbeat-slow.mp3')),
    place: useAudioPlayer(require('../assets/audio/sfx-place.mp3')),
    keeper: useAudioPlayer(require('../assets/audio/sfx-keeper.mp3')),
    turn: useAudioPlayer(require('../assets/audio/sfx-turn.mp3')),
    prisoner: useAudioPlayer(require('../assets/audio/sfx-prisoner.mp3')),
  };
  const current = useRef<Track | null>(null);
  const fades = useRef(new Map<Player, ReturnType<typeof setInterval>>());
  const api = useRef<Audio | null>(null);

  const fade = (player: Player, to: number, ms: number, done?: () => void) => {
    const running = fades.current.get(player);
    if (running) clearInterval(running);
    const from = player.volume;
    const steps = Math.max(1, Math.round(ms / STEP_MS));
    let i = 0;
    const id = setInterval(() => {
      i++;
      player.volume = from + ((to - from) * i) / steps;
      if (i >= steps) {
        clearInterval(id);
        fades.current.delete(player);
        done?.();
      }
    }, STEP_MS);
    fades.current.set(player, id);
  };

  if (!api.current) {
    api.current = {
      music: (track) => {
        if (current.current === track) return;
        const old = current.current && tracks[current.current];
        current.current = track;
        if (old) fade(old, 0, FADE_OUT_MS, () => old.pause());
        const next = tracks[track];
        next.loop = true;
        next.volume = 0;
        next.play();
        fade(next, TRACK_VOLUME[track], FADE_IN_MS);
      },
      sfx: (name, volume = 0.9) => {
        const p = sounds[name];
        p.volume = volume;
        p.seekTo(0);
        p.play();
      },
    };
  }

  // Scary music from the start, even with the iPhone's silent switch on.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
    api.current?.music('main');
    const running = fades.current;
    return () => running.forEach((id) => clearInterval(id));
  }, []);

  return <Ctx.Provider value={api.current}>{children}</Ctx.Provider>;
}
