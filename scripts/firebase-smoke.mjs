// Checks the Firebase setup the way the app uses it, then deletes everything it created.
// Run with: node --env-file=.env scripts/firebase-smoke.mjs
import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, deleteUser, getAuth, updateProfile } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, limit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';

const env = process.env;
const app = initializeApp({
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
});
const auth = getAuth(app);
const db = getFirestore(app);

const step = async (name, fn) => {
  try {
    const out = await fn();
    console.log(`✔ ${name}`);
    return out;
  } catch (e) {
    console.log(`✖ ${name}: ${e.code ?? ''} ${e.message}`);
    throw e;
  }
};

const email = `smoke-test-${Date.now()}@example.com`;
let user, runRef;
try {
  user = await step('Email/password sign-up (Authentication)', async () => (await createUserWithEmailAndPassword(auth, email, 'smoke-test-pw')).user);
  await step('Set display name', () => updateProfile(user, { displayName: 'Smoke Test' }));
  const userRef = doc(db, 'users', user.uid);
  await step('Write users/{uid} (Firestore)', () => setDoc(userRef, { displayName: 'Smoke Test', createdAt: serverTimestamp() }));
  runRef = await step('Add a run to runs/', () =>
    addDoc(collection(db, 'runs'), {
      uid: user.uid, displayName: 'Smoke Test', levelTimes: [60, 90, 80], levelPoints: [667, 500, 467],
      timeouts: 0, totalScore: 1634, totalTime: 230, createdAt: serverTimestamp(),
    }),
  );
  await step('Update best run', () => setDoc(userRef, { bestScore: 1634, bestTime: 230, bestRunId: runRef.id }, { merge: true }));
  await step('Read it back', async () => {
    const d = (await getDoc(userRef)).data();
    if (d?.bestScore !== 1634) throw new Error(`unexpected data: ${JSON.stringify(d)}`);
  });
  await step('Leaderboard query', async () => {
    const snap = await getDocs(query(collection(db, 'users'), orderBy('bestScore', 'desc'), limit(50)));
    if (!snap.docs.some((d) => d.id === user.uid)) throw new Error('test user missing from leaderboard');
    console.log(`  leaderboard has ${snap.size} player(s)`);
  });
} finally {
  if (runRef) await deleteDoc(runRef).catch(() => {});
  if (user) {
    await deleteDoc(doc(db, 'users', user.uid)).catch(() => {});
    await deleteUser(user).catch((e) => console.log(`  (couldn't delete test account ${email}: ${e.code})`));
  }
  console.log('Cleaned up test data.');
  process.exit(0);
}
