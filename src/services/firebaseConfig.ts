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

const defaultFirebaseOptions: FirebaseOptions = {
  apiKey: 'AIzaSyBFCcOdy9yvvjmbw-fDP3IBz2mhzJp5JeA',
  authDomain: 'signinandsignupweb.firebaseapp.com',
  projectId: 'signinandsignupweb',
  storageBucket: 'signinandsignupweb.firebasestorage.app',
  messagingSenderId: '568031792138',
  appId: '1:568031792138:web:7174732247f81d92d4e3f3',
  measurementId: 'G-LG3C5VMZHQ',
};

const firebaseOptions: FirebaseOptions = {
  apiKey: import.meta.env.VITE_ADMIN_FIREBASE_API_KEY || defaultFirebaseOptions.apiKey,
  authDomain:
    import.meta.env.VITE_ADMIN_FIREBASE_AUTH_DOMAIN || defaultFirebaseOptions.authDomain,
  projectId: import.meta.env.VITE_ADMIN_FIREBASE_PROJECT_ID || defaultFirebaseOptions.projectId,
  storageBucket:
    import.meta.env.VITE_ADMIN_FIREBASE_STORAGE_BUCKET || defaultFirebaseOptions.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_ADMIN_FIREBASE_MESSAGING_SENDER_ID ||
    defaultFirebaseOptions.messagingSenderId,
  appId: import.meta.env.VITE_ADMIN_FIREBASE_APP_ID || defaultFirebaseOptions.appId,
  measurementId:
    import.meta.env.VITE_ADMIN_FIREBASE_MEASUREMENT_ID ||
    defaultFirebaseOptions.measurementId,
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
