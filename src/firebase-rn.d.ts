// Metro bundles Firebase Auth's React Native build, which exports getReactNativePersistence,
// but TypeScript only sees the browser types. Declare the one missing function.
import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: unknown): Persistence;
}
