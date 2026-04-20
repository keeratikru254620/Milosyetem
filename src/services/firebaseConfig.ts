import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';

const authBackendMode = (import.meta.env.VITE_AUTH_BACKEND ?? 'local').toLowerCase();

const firebaseOptions: FirebaseOptions = {
  apiKey: 'AIzaSyAr-x-YKv6GD4cbFDJ7c6UF_5QsLzK8FgA',
  authDomain: 'milosystem-firebase-cb1aa.firebaseapp.com',
  projectId: 'milosystem-firebase-cb1aa',
  storageBucket: 'milosystem-firebase-cb1aa.firebasestorage.app',
  messagingSenderId: '382930075881',
  appId: '1:382930075881:web:d93f778d909c06d9d13078',
  measurementId: 'G-XWG0BJ51Z8',
};

const requiredKeys: Array<keyof FirebaseOptions> = [
  'apiKey',
  'authDomain',
  'projectId',
  'appId',
];

export const isFirebaseAuthEnabled = authBackendMode === 'firebase';
export const isFirebaseConfigured =
  isFirebaseAuthEnabled && requiredKeys.every((key) => Boolean(firebaseOptions[key]));
export const firebaseApp = isFirebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseOptions)
  : null;
export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const analyticsPromise: Promise<Analytics | null> =
  firebaseApp && typeof window !== 'undefined'
    ? isSupported()
        .then((supported) => (supported ? getAnalytics(firebaseApp) : null))
        .catch(() => null)
    : Promise.resolve(null);

if (auth && typeof window !== 'undefined') {
  void setPersistence(auth, browserLocalPersistence).catch(() => undefined);
}
