import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getReactNativePersistence, // typed in firebase-rn.d.ts
  initializeAuth,
  signInWithEmailAndPassword,
  updateProfile,
  User,
} from 'firebase/auth';
import { addDoc, collection, doc, getDocs, getFirestore, limit, orderBy, query, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
import type { RunResult } from './GameScreen';
import { compareRuns } from './scoring';

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Without Firebase keys the game still runs: no login, nothing saved, no leaderboard.
export const firebaseEnabled = !!config.apiKey && !!config.projectId;
const app = firebaseEnabled ? initializeApp(config) : null;
export const auth = app ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) }) : null;
const db = app ? getFirestore(app) : null;

export type LeaderboardEntry = { uid: string; displayName: string; bestScore: number; bestTime: number };

export async function signUp(email: string, password: string, displayName: string): Promise<User> {
  if (!auth || !db) throw new Error('Firebase is not configured');
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(user, { displayName });
  // No bestScore yet, so the player only appears on the leaderboard after a completed run.
  await setDoc(doc(db, 'users', user.uid), { displayName, createdAt: serverTimestamp() });
  return user;
}

export async function signIn(email: string, password: string): Promise<User> {
  if (!auth) throw new Error('Firebase is not configured');
  return (await signInWithEmailAndPassword(auth, email.trim(), password)).user;
}

// Saves a completed run and updates the player's best if this run beats it.
export async function saveRun(user: User, r: RunResult): Promise<void> {
  if (!db) return;
  const displayName = user.displayName ?? 'Nameless soul';
  const run = await addDoc(collection(db, 'runs'), {
    uid: user.uid,
    displayName,
    levelTimes: r.levelTimes,
    levelPoints: r.levelPoints,
    timeouts: r.timeouts,
    totalScore: r.totalScore,
    totalTime: r.totalTime,
    createdAt: serverTimestamp(),
  });
  const userRef = doc(db, 'users', user.uid);
  await runTransaction(db, async (tx) => {
    const best = (await tx.get(userRef)).data();
    const isBetter =
      typeof best?.bestScore !== 'number' ||
      compareRuns({ score: r.totalScore, time: r.totalTime }, { score: best.bestScore, time: best.bestTime }) < 0;
    if (isBetter) {
      tx.set(userRef, { displayName, bestScore: r.totalScore, bestTime: r.totalTime, bestRunId: run.id }, { merge: true });
    }
  });
}

// Each player's best run, highest score first, ties to the faster time. Top 20.
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, 'users'), orderBy('bestScore', 'desc'), limit(50)));
  return snap.docs
    .map((d) => ({ uid: d.id, ...(d.data() as Omit<LeaderboardEntry, 'uid'>) }))
    .sort((a, b) => compareRuns({ score: a.bestScore, time: a.bestTime }, { score: b.bestScore, time: b.bestTime }))
    .slice(0, 20);
}

export function authErrorMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  const messages: Record<string, string> = {
    'auth/invalid-email': 'That email is not valid.',
    'auth/email-already-in-use': 'That email already has an account. Log in instead.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/user-not-found': 'No account with that email.',
    'auth/wrong-password': 'Wrong email or password.',
    'auth/network-request-failed': 'No connection. Check your internet.',
    'auth/too-many-requests': 'Too many tries. Wait a moment.',
  };
  return messages[code] ?? 'Something went wrong. Try again.';
}
