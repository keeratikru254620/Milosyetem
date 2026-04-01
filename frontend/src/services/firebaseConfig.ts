import {
  deleteApp,
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
} from 'firebase/app';
import {
  getAnalytics,
  isSupported as isAnalyticsSupported,
  type Analytics,
} from 'firebase/analytics';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseWebConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim() ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim() ?? '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID?.trim() ?? '',
};

const requiredConfigEntries = Object.entries({
  apiKey: firebaseWebConfig.apiKey,
  authDomain: firebaseWebConfig.authDomain,
  projectId: firebaseWebConfig.projectId,
  storageBucket: firebaseWebConfig.storageBucket,
  appId: firebaseWebConfig.appId,
});

export const hasFirebaseConfig = requiredConfigEntries.every(([, value]) => Boolean(value));

const getOrCreateFirebaseApp = () => {
  if (!hasFirebaseConfig) {
    const missingKeys = requiredConfigEntries
      .filter(([, value]) => !value)
      .map(([key]) => key)
      .join(', ');

    throw new Error(
      `Firebase ยังตั้งค่าไม่ครบ กรุณาระบุ ${missingKeys} ใน frontend/.env.local`,
    );
  }

  return getApps().length > 0 ? getApp() : initializeApp(firebaseWebConfig);
};

let firebaseAppCache: FirebaseApp | null = null;
let firebaseAuthCache: Auth | null = null;
let firestoreCache: Firestore | null = null;
let storageCache: FirebaseStorage | null = null;
let analyticsInitPromise: Promise<Analytics | null> | null = null;

export const getFirebaseApp = () => {
  firebaseAppCache ??= getOrCreateFirebaseApp();
  return firebaseAppCache;
};

export const getFirebaseAuth = () => {
  firebaseAuthCache ??= getAuth(getFirebaseApp());
  return firebaseAuthCache;
};

export const getFirebaseDb = () => {
  firestoreCache ??= getFirestore(getFirebaseApp());
  return firestoreCache;
};

export const getFirebaseStorage = () => {
  storageCache ??= getStorage(getFirebaseApp());
  return storageCache;
};

export const initializeFirebaseAnalytics = async () => {
  if (!firebaseWebConfig.measurementId || typeof window === 'undefined') {
    return null;
  }

  analyticsInitPromise ??= (async () => {
    const supported = await isAnalyticsSupported();
    return supported ? getAnalytics(getFirebaseApp()) : null;
  })();

  return analyticsInitPromise;
};

export const createSecondaryFirebaseApp = () => {
  if (!hasFirebaseConfig) {
    getOrCreateFirebaseApp();
  }

  return initializeApp(
    firebaseWebConfig,
    `milosystem-secondary-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  );
};

export const disposeFirebaseApp = async (app: FirebaseApp) => {
  await deleteApp(app);
};
