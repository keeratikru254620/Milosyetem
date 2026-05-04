import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  getAuth,
  setPersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const authBackendMode = (import.meta.env.VITE_AUTH_BACKEND ?? 'firebase').toLowerCase();

const firebaseOptions: FirebaseOptions = {
  apiKey: import.meta.env.VITE_ADMIN_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_ADMIN_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_ADMIN_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_ADMIN_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_ADMIN_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_ADMIN_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_ADMIN_FIREBASE_MEASUREMENT_ID,
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
export const db = firebaseApp ? getFirestore(firebaseApp) : null;
export const storage = firebaseApp ? getStorage(firebaseApp) : null;
export const analyticsPromise: Promise<Analytics | null> =
  firebaseApp && typeof window !== 'undefined'
    ? isSupported()
        .then((supported) => (supported ? getAnalytics(firebaseApp) : null))
        .catch(() => null)
    : Promise.resolve(null);

if (import.meta.env.DEV) {
  console.info(
    `[Firebase] auth=${isFirebaseConfigured ? 'enabled' : 'disabled'} project=${
      firebaseOptions.projectId || 'none'
    }`,
  );
}

export const configureFirebasePersistence = async (rememberMe: boolean) => {
  if (!auth || typeof window === 'undefined') {
    return;
  }

  await setPersistence(
    auth,
    rememberMe ? browserLocalPersistence : browserSessionPersistence,
  );
};
