import { deleteApp, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  inMemoryPersistence,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  type User as FirebaseAuthUser,
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';

import { previewDocTypes, previewDocuments } from '../app/previewData';
import type {
  DocType,
  DocumentData,
  SaveDocTypeInput,
  SaveDocumentInput,
  SaveUserInput,
  StoredFile,
  User,
  UserRole,
} from '../types';
import { normalizeIdentity, normalizeRole } from '../utils/auth';
import { buildDocumentSearchIndex, normalizeStoredFile } from '../utils/documentSearch';
import {
  APP_USERS_COLLECTION,
  auth,
  db,
  firebaseAppConfig,
  isFirebaseConfigured,
} from './firebaseConfig';

const DOC_TYPES_KEY = 'milosystem:docTypes';
const DOCUMENTS_KEY = 'milosystem:documents';
const LOCAL_DB_NAME = 'milosystem-local-db';
const LOCAL_DB_VERSION = 1;
const LOCAL_DB_STORE = 'app-data';

interface AppUserProfile {
  username: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  disabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

let localDbPromise: Promise<IDBDatabase | null> | null = null;

const hasWindow = () => typeof window !== 'undefined';

const createId = (prefix: string) =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const nowIso = () => new Date().toISOString();

const getLocalStorageItem = <T>(key: string, fallback: T): T => {
  if (!hasWindow()) {
    return clone(fallback);
  }

  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return clone(fallback);
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return clone(fallback);
  }
};

const removeLocalStorageItem = (key: string) => {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.removeItem(key);
};

const setLocalStorageItem = <T>(key: string, value: T) => {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

const requestToPromise = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });

const openLocalDb = async () => {
  if (!hasWindow() || !('indexedDB' in window)) {
    return null;
  }

  if (!localDbPromise) {
    localDbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = window.indexedDB.open(LOCAL_DB_NAME, LOCAL_DB_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(LOCAL_DB_STORE)) {
          database.createObjectStore(LOCAL_DB_STORE);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Unable to open IndexedDB'));
    }).catch((): IDBDatabase | null => null);
  }

  return localDbPromise;
};

const readIndexedDbItem = async <T>(key: string) => {
  const database = await openLocalDb();

  if (!database) {
    return undefined;
  }

  const transaction = database.transaction(LOCAL_DB_STORE, 'readonly');
  const store = transaction.objectStore(LOCAL_DB_STORE);
  const result = await requestToPromise(store.get(key));

  return result as T | undefined;
};

const writeIndexedDbItem = async <T>(key: string, value: T) => {
  const database = await openLocalDb();

  if (!database) {
    return false;
  }

  const transaction = database.transaction(LOCAL_DB_STORE, 'readwrite');
  const store = transaction.objectStore(LOCAL_DB_STORE);
  await requestToPromise(store.put(clone(value), key));
  return true;
};

const getPersistedItem = async <T>(key: string, fallback: T): Promise<T> => {
  const indexedDbValue = await readIndexedDbItem<T>(key);

  if (indexedDbValue !== undefined) {
    return clone(indexedDbValue);
  }

  const localStorageValue = getLocalStorageItem<T>(key, fallback);
  const hasLegacyValue = hasWindow() && window.localStorage.getItem(key) !== null;

  if (hasLegacyValue) {
    const migrated = await writeIndexedDbItem(key, localStorageValue);

    if (migrated) {
      removeLocalStorageItem(key);
    }
  }

  return clone(localStorageValue);
};

const setPersistedItem = async <T>(key: string, value: T) => {
  const savedToIndexedDb = await writeIndexedDbItem(key, value);

  if (savedToIndexedDb) {
    removeLocalStorageItem(key);
    return;
  }

  setLocalStorageItem(key, value);
};

const getDocTypesStore = () => getPersistedItem<DocType[]>(DOC_TYPES_KEY, previewDocTypes);
const getDocumentsStore = () => getPersistedItem<DocumentData[]>(DOCUMENTS_KEY, previewDocuments);
const saveDocTypesStore = (docTypes: DocType[]) => setPersistedItem(DOC_TYPES_KEY, docTypes);
const saveDocumentsStore = (documents: DocumentData[]) =>
  setPersistedItem(DOCUMENTS_KEY, documents);

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });

const mapLocalFiles = async (filesMeta: StoredFile[] = [], uploadedFiles: File[] = []) => {
  const pendingUploads = [...uploadedFiles];
  const nextFiles: StoredFile[] = [];

  for (const rawFile of filesMeta) {
    const normalized = normalizeStoredFile(rawFile);

    if (normalized.url) {
      nextFiles.push(normalized);
      continue;
    }

    const upload = pendingUploads.shift();

    if (!upload) {
      nextFiles.push(normalized);
      continue;
    }

    const dataUrl = await fileToDataUrl(upload);

    nextFiles.push(
      normalizeStoredFile({
        ...normalized,
        fileId: normalized.fileId || normalized.clientId || createId('file'),
        storedName: normalized.storedName || normalized.originalName || upload.name,
        originalName: normalized.originalName || upload.name,
        url: dataUrl,
        mimeType: normalized.mimeType || upload.type || undefined,
        size: normalized.size || upload.size,
      }),
    );
  }

  while (pendingUploads.length > 0) {
    const upload = pendingUploads.shift();

    if (!upload) {
      continue;
    }

    const dataUrl = await fileToDataUrl(upload);

    nextFiles.push(
      normalizeStoredFile({
        fileId: createId('file'),
        storedName: upload.name,
        originalName: upload.name,
        url: dataUrl,
        mimeType: upload.type || undefined,
        size: upload.size,
      }),
    );
  }

  return nextFiles;
};

const ensureFirebaseReady = () => {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error('firebase_not_configured');
  }

  return { auth, db };
};

const getFirebaseErrorCode = (error: unknown) =>
  error && typeof error === 'object' && 'code' in error
    ? String((error as { code?: string }).code ?? '')
    : '';

const mapFirebaseError = (error: unknown, fallbackMessage: string) => {
  const code = getFirebaseErrorCode(error);

  switch (code) {
    case 'auth/email-already-in-use':
      return new Error('duplicate_record');
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/invalid-email':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return new Error('invalid_credentials');
    case 'auth/user-disabled':
      return new Error('account_disabled');
    case 'auth/weak-password':
      return new Error('password_too_short');
    case 'auth/operation-not-allowed':
      return new Error('email_password_not_enabled');
    case 'auth/network-request-failed':
      return new Error('firebase_network_failed');
    case 'auth/too-many-requests':
      return new Error('too_many_requests');
    case 'auth/requires-recent-login':
      return new Error('requires_recent_login');
    case 'permission-denied':
      return new Error('firebase_profile_access_denied');
    default:
      if (error instanceof Error && error.message.trim()) {
        return error;
      }

      return new Error(fallbackMessage);
  }
};

const resolveCurrentFirebaseUser = async () => {
  if (!auth) {
    return null;
  }

  const firebaseAuth = auth;

  if (firebaseAuth.currentUser) {
    return firebaseAuth.currentUser;
  }

  return new Promise<FirebaseAuthUser | null>((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      reject,
    );
  });
};

const buildFallbackProfile = (firebaseUser: FirebaseAuthUser): AppUserProfile => {
  const email = normalizeIdentity(firebaseUser.email || '');
  const name = firebaseUser.displayName?.trim() || email || 'User';

  return {
    username: email,
    email,
    name,
    role: 'general',
    avatar: firebaseUser.photoURL || undefined,
    phone: undefined,
    disabled: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
};

const normalizeStoredProfile = (
  data: Partial<AppUserProfile>,
  fallback: AppUserProfile,
): AppUserProfile => ({
  username: normalizeIdentity(data.username || data.email || fallback.email),
  email: normalizeIdentity(data.email || data.username || fallback.email),
  name: (data.name || fallback.name).trim() || fallback.name,
  role: normalizeRole(data.role || fallback.role),
  avatar: data.avatar?.trim() || fallback.avatar,
  phone: data.phone?.trim() || fallback.phone,
  disabled: Boolean(data.disabled),
  createdAt: data.createdAt || fallback.createdAt,
  updatedAt: data.updatedAt || fallback.updatedAt,
});

const mapProfileToUser = (uid: string, profile: AppUserProfile): User => ({
  _id: uid,
  username: profile.username || profile.email,
  email: profile.email || profile.username,
  name: profile.name,
  role: normalizeRole(profile.role),
  avatar: profile.avatar,
  phone: profile.phone,
});

const loadUserProfile = async (firebaseUser: FirebaseAuthUser) => {
  const { db: firestore } = ensureFirebaseReady();
  const profileRef = doc(firestore, APP_USERS_COLLECTION, firebaseUser.uid);
  const fallbackProfile = buildFallbackProfile(firebaseUser);
  const profileSnapshot = await getDoc(profileRef);

  if (!profileSnapshot.exists()) {
    await setDoc(profileRef, fallbackProfile, { merge: true });
    return fallbackProfile;
  }

  const profile = normalizeStoredProfile(
    profileSnapshot.data() as Partial<AppUserProfile>,
    fallbackProfile,
  );

  if (
    profile.username !== fallbackProfile.username ||
    profile.email !== fallbackProfile.email ||
    (!profile.avatar && fallbackProfile.avatar)
  ) {
    await setDoc(
      profileRef,
      {
        username: fallbackProfile.username,
        email: fallbackProfile.email,
        avatar: profile.avatar || fallbackProfile.avatar,
        updatedAt: nowIso(),
      },
      { merge: true },
    );
  }

  if (profile.disabled) {
    throw new Error('account_disabled');
  }

  return profile;
};

const buildSecondaryAuthContext = async () => {
  if (!firebaseAppConfig.apiKey) {
    throw new Error('firebase_not_configured');
  }

  const secondaryApp = initializeApp(firebaseAppConfig, `secondary-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  await setPersistence(secondaryAuth, inMemoryPersistence);

  return { secondaryApp, secondaryAuth };
};

const getExistingProfile = async (id: string, currentFirebaseUser: FirebaseAuthUser | null) => {
  const { db: firestore } = ensureFirebaseReady();
  const profileRef = doc(firestore, APP_USERS_COLLECTION, id);
  const profileSnapshot = await getDoc(profileRef);

  if (profileSnapshot.exists()) {
    const rawProfile = profileSnapshot.data() as Partial<AppUserProfile>;
    const fallbackProfile =
      currentFirebaseUser?.uid === id
        ? buildFallbackProfile(currentFirebaseUser)
        : {
            username: normalizeIdentity(rawProfile.username || rawProfile.email || ''),
            email: normalizeIdentity(rawProfile.email || rawProfile.username || ''),
            name:
              rawProfile.name?.trim() ||
              rawProfile.username?.trim() ||
              rawProfile.email?.trim() ||
              'User',
            role: normalizeRole(rawProfile.role),
            avatar: rawProfile.avatar?.trim() || undefined,
            phone: rawProfile.phone?.trim() || undefined,
            disabled: Boolean(rawProfile.disabled),
            createdAt: rawProfile.createdAt || nowIso(),
            updatedAt: rawProfile.updatedAt || nowIso(),
          };

    return normalizeStoredProfile(rawProfile, fallbackProfile);
  }

  if (currentFirebaseUser?.uid === id) {
    return buildFallbackProfile(currentFirebaseUser);
  }

  return null;
};

export const api = {
  login: async (username: string, password: string): Promise<{ user: User; token: string }> => {
    const { auth: firebaseAuth } = ensureFirebaseReady();
    const email = normalizeIdentity(username);

    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);

      if (!credential.user.emailVerified) {
        await signOut(firebaseAuth);
        throw new Error('email_not_verified');
      }

      const profile = await loadUserProfile(credential.user);

      return {
        user: mapProfileToUser(credential.user.uid, profile),
        token: '',
      };
    } catch (error) {
      throw mapFirebaseError(error, 'ไม่สามารถเข้าสู่ระบบได้');
    }
  },

  verifySession: async (): Promise<User | null> => {
    if (!isFirebaseConfigured || !auth) {
      return null;
    }

    const firebaseUser = await resolveCurrentFirebaseUser();

    if (!firebaseUser) {
      return null;
    }

    try {
      await firebaseUser.reload();
      const currentFirebaseUser = auth.currentUser ?? firebaseUser;

      if (!currentFirebaseUser.emailVerified) {
        await signOut(auth);
        return null;
      }

      const profile = await loadUserProfile(currentFirebaseUser);
      return mapProfileToUser(currentFirebaseUser.uid, profile);
    } catch (error) {
      if (error instanceof Error && error.message === 'account_disabled') {
        await signOut(auth);
        return null;
      }

      const fallbackProfile = buildFallbackProfile(firebaseUser);
      return mapProfileToUser(firebaseUser.uid, fallbackProfile);
    }
  },

  logout: () => {
    if (!auth) {
      return;
    }

    void signOut(auth);
  },

  requestPasswordReset: async (email: string) => {
    const { auth: firebaseAuth } = ensureFirebaseReady();

    try {
      await sendPasswordResetEmail(firebaseAuth, normalizeIdentity(email));
      return true;
    } catch (error) {
      throw mapFirebaseError(error, 'ไม่สามารถส่งอีเมลรีเซ็ตรหัสผ่านได้');
    }
  },

  register: async (userData: Omit<User, '_id'>): Promise<{ user: User; token: string }> => {
    const { auth: firebaseAuth, db: firestore } = ensureFirebaseReady();
    const email = normalizeIdentity(userData.email || userData.username);
    const password = (userData.password || '').trim();
    const name = (userData.name || '').trim();
    const phone = userData.phone?.trim() || undefined;
    const avatar = userData.avatar?.trim() || undefined;

    if (!email) {
      throw new Error('กรุณากรอกอีเมล');
    }

    if (!password) {
      throw new Error('กรุณากรอกรหัสผ่าน');
    }

    if (password.length < 6) {
      throw new Error('password_too_short');
    }

    if (!name) {
      throw new Error('กรุณากรอกชื่อผู้ใช้งาน');
    }

    try {
      const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);

      await updateProfile(credential.user, {
        displayName: name,
        photoURL: avatar || null,
      });

      const profile: AppUserProfile = {
        username: email,
        email,
        name,
        role: 'general',
        avatar,
        phone,
        disabled: false,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };

      await setDoc(doc(firestore, APP_USERS_COLLECTION, credential.user.uid), profile, {
        merge: true,
      });

      await sendEmailVerification(credential.user);
      await signOut(firebaseAuth);

      return {
        user: mapProfileToUser(credential.user.uid, profile),
        token: '',
      };
    } catch (error) {
      if (firebaseAuth.currentUser) {
        await signOut(firebaseAuth).catch(() => undefined);
      }

      throw mapFirebaseError(error, 'ไม่สามารถสมัครสมาชิกได้');
    }
  },

  getUsers: async () => {
    if (!isFirebaseConfigured || !db) {
      return [];
    }

    try {
      const snapshot = await getDocs(collection(db, APP_USERS_COLLECTION));

      return snapshot.docs
        .map((profileDocument) => {
          const rawProfile = profileDocument.data() as Partial<AppUserProfile>;
          const normalizedProfile = normalizeStoredProfile(rawProfile, {
            username: normalizeIdentity(rawProfile.username || rawProfile.email || ''),
            email: normalizeIdentity(rawProfile.email || rawProfile.username || ''),
            name:
              rawProfile.name?.trim() ||
              rawProfile.username?.trim() ||
              rawProfile.email?.trim() ||
              'User',
            role: normalizeRole(rawProfile.role),
            avatar: rawProfile.avatar?.trim() || undefined,
            phone: rawProfile.phone?.trim() || undefined,
            disabled: Boolean(rawProfile.disabled),
            createdAt: rawProfile.createdAt || nowIso(),
            updatedAt: rawProfile.updatedAt || nowIso(),
          });

          return {
            disabled: Boolean(rawProfile.disabled),
            user: mapProfileToUser(profileDocument.id, normalizedProfile),
          };
        })
        .filter((entry) => entry.user.role && entry.user.username && !entry.disabled)
        .map((entry) => entry.user)
        .sort((left, right) => left.name.localeCompare(right.name, 'th'));
    } catch {
      return [];
    }
  },

  saveUser: async (payload: SaveUserInput, id?: string) => {
    const { db: firestore } = ensureFirebaseReady();
    const currentFirebaseUser = await resolveCurrentFirebaseUser();

    if (!id) {
      const email = normalizeIdentity(payload.email || payload.username);
      const password = (payload.password || '').trim();
      const name = (payload.name || '').trim();

      if (!email || !password || !name) {
        throw new Error('กรุณากรอกชื่อผู้ใช้ ชื่อ และรหัสผ่านให้ครบ');
      }

      if (password.length < 6) {
        throw new Error('password_too_short');
      }

      const { secondaryApp, secondaryAuth } = await buildSecondaryAuthContext();

      try {
        const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const nextProfile: AppUserProfile = {
          username: email,
          email,
          name,
          role: normalizeRole(payload.role || 'officer'),
          avatar: payload.avatar?.trim() || undefined,
          phone: payload.phone?.trim() || undefined,
          disabled: false,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };

        await updateProfile(credential.user, {
          displayName: nextProfile.name,
          photoURL: nextProfile.avatar || null,
        });
        await setDoc(doc(firestore, APP_USERS_COLLECTION, credential.user.uid), nextProfile, {
          merge: true,
        });
        await sendEmailVerification(credential.user);
        await signOut(secondaryAuth).catch(() => undefined);

        return mapProfileToUser(credential.user.uid, nextProfile);
      } catch (error) {
        throw mapFirebaseError(error, 'ไม่สามารถเพิ่มผู้ใช้งานได้');
      } finally {
        await deleteApp(secondaryApp).catch(() => undefined);
      }
    }

    const existingProfile = await getExistingProfile(id, currentFirebaseUser);

    if (!existingProfile) {
      throw new Error('ไม่พบข้อมูลผู้ใช้');
    }

    if (payload.password?.trim() && currentFirebaseUser?.uid !== id) {
      throw new Error('ยังไม่รองรับการเปลี่ยนรหัสผ่านของผู้ใช้อื่นจากหน้านี้');
    }

    const nextProfile: AppUserProfile = {
      ...existingProfile,
      name: payload.name !== undefined ? payload.name.trim() || existingProfile.name : existingProfile.name,
      role: payload.role !== undefined ? normalizeRole(payload.role) : existingProfile.role,
      avatar:
        payload.avatar !== undefined ? payload.avatar.trim() || undefined : existingProfile.avatar,
      phone: payload.phone !== undefined ? payload.phone.trim() || undefined : existingProfile.phone,
      updatedAt: nowIso(),
    };

    try {
      if (currentFirebaseUser?.uid === id) {
        if (payload.password?.trim()) {
          await updatePassword(currentFirebaseUser, payload.password.trim());
        }

        if (
          nextProfile.name !== (currentFirebaseUser.displayName || '').trim() ||
          nextProfile.avatar !== (currentFirebaseUser.photoURL || undefined)
        ) {
          await updateProfile(currentFirebaseUser, {
            displayName: nextProfile.name,
            photoURL: nextProfile.avatar || null,
          });
        }
      }

      await setDoc(doc(firestore, APP_USERS_COLLECTION, id), nextProfile, { merge: true });
      return mapProfileToUser(id, nextProfile);
    } catch (error) {
      throw mapFirebaseError(error, 'ไม่สามารถบันทึกข้อมูลผู้ใช้ได้');
    }
  },

  deleteUser: async (id: string) => {
    const { db: firestore } = ensureFirebaseReady();
    const currentFirebaseUser = await resolveCurrentFirebaseUser();

    if (currentFirebaseUser?.uid === id) {
      throw new Error('ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่ได้');
    }

    const existingProfile = await getExistingProfile(id, currentFirebaseUser);

    if (!existingProfile) {
      throw new Error('ไม่พบข้อมูลผู้ใช้');
    }

    await setDoc(
      doc(firestore, APP_USERS_COLLECTION, id),
      {
        ...existingProfile,
        disabled: true,
        updatedAt: nowIso(),
      },
      { merge: true },
    );

    return true;
  },

  getDocTypes: async () =>
    [...(await getDocTypesStore())].sort((left, right) => left.name.localeCompare(right.name, 'th')),

  saveDocType: async (payload: SaveDocTypeInput, id?: string) => {
    const docTypes = await getDocTypesStore();
    const name = (payload.name || '').trim();
    const color = (payload.color || '#1e3a8a').trim();

    if (!name) {
      throw new Error('กรุณาระบุชื่อประเภทเอกสาร');
    }

    const nextDocType: DocType = {
      _id: id || createId('doctype'),
      name,
      color,
    };

    const nextDocTypes = id
      ? docTypes.map((docType) => (docType._id === id ? nextDocType : docType))
      : [nextDocType, ...docTypes];

    await saveDocTypesStore(nextDocTypes);
    return nextDocType;
  },

  deleteDocType: async (id: string) => {
    const documents = await getDocumentsStore();

    if (documents.some((document) => document.typeId === id)) {
      throw new Error('ไม่สามารถลบประเภทเอกสารที่ถูกใช้งานอยู่ได้');
    }

    await saveDocTypesStore((await getDocTypesStore()).filter((docType) => docType._id !== id));
    return true;
  },

  getDocuments: async () =>
    [...(await getDocumentsStore())].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),

  saveDocument: async (payload: SaveDocumentInput, id?: string) => {
    const documents = await getDocumentsStore();
    const existingDocument = id ? documents.find((document) => document._id === id) : null;
    const nextFiles = await mapLocalFiles(payload.files ?? [], payload.uploadedFiles ?? []);
    const indexed = buildDocumentSearchIndex({
      docNo: payload.docNo,
      subject: payload.subject,
      origin: payload.origin,
      resp: payload.resp,
      files: nextFiles,
    });
    const timestamp = new Date().toISOString();
    const nextDocument: DocumentData = {
      _id: id || createId('document'),
      docNo: (payload.docNo || '').trim(),
      subject: (payload.subject || '').trim(),
      typeId: (payload.typeId || '').trim(),
      fiscalYear: Number(payload.fiscalYear || new Date().getFullYear() + 543),
      date: payload.date || '',
      origin: (payload.origin || '').trim(),
      resp: (payload.resp || '').trim(),
      ownerId: payload.ownerId || existingDocument?.ownerId || '',
      files: indexed.files.map((file) => normalizeStoredFile(file)),
      createdAt: existingDocument?.createdAt || timestamp,
      searchableContent: indexed.searchableContent,
      semanticKeywords: indexed.semanticKeywords ?? [],
      contentIndexedAt: indexed.contentIndexedAt,
    };

    if (!nextDocument.subject || !nextDocument.typeId) {
      throw new Error('กรุณากรอกเรื่องและเลือกประเภทเอกสาร');
    }

    const nextDocuments = existingDocument
      ? documents.map((document) => (document._id === nextDocument._id ? nextDocument : document))
      : [nextDocument, ...documents];

    await saveDocumentsStore(nextDocuments);
    return nextDocument;
  },

  deleteDocument: async (id: string) => {
    await saveDocumentsStore((await getDocumentsStore()).filter((document) => document._id !== id));
    return true;
  },
};
