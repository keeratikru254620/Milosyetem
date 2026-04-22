import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  type User as FirebaseAuthUser,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { localAuthSeedUsers } from '../data/localAuthUsers';
import { previewDocTypes, previewDocuments } from '../data/previewData';
import type {
  DocType,
  DocumentData,
  SaveDocTypeInput,
  SaveDocumentInput,
  SaveUserInput,
  StoredFile,
  User,
} from '../types';
import { normalizeIdentity, normalizeRole, stripPassword } from '../utils/auth';
import { buildDocumentSearchIndex, normalizeStoredFile } from '../utils/documentSearch';
import {
  auth,
  configureFirebasePersistence,
  db,
  isFirebaseConfigured,
  storage,
} from './firebaseConfig';

const USERS_KEY = 'milosystem:users';
const DOC_TYPES_KEY = 'milosystem:docTypes';
const DOCUMENTS_KEY = 'milosystem:documents';
const LOCAL_AUTH_SESSION_KEY = 'milosystem:auth-session';
const AUTH_PERSISTENCE_KEY = 'milosystem:auth-persistence';
const LOCAL_DB_NAME = 'milosystem-local-db';
const LOCAL_DB_VERSION = 1;
const LOCAL_DB_STORE = 'app-data';
const FIRESTORE_USERS_COLLECTION = 'users';
const FIRESTORE_DOC_TYPES_COLLECTION = 'docTypes';
const FIRESTORE_DOCUMENTS_COLLECTION = 'documents';
const DOCUMENT_STORAGE_PREFIX = 'documents';
const DEFAULT_USER_LABEL = 'ผู้ใช้งาน';
const DEFAULT_DOC_TYPE_COLOR = '#1e3a8a';

type AuthPersistenceMode = 'remember' | 'session';

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

const removeBrowserStorageItem = (key: string) => {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.removeItem(key);
  window.sessionStorage.removeItem(key);
};

const setBrowserStorageItem = (key: string, value: string, mode: AuthPersistenceMode) => {
  if (!hasWindow()) {
    return;
  }

  removeBrowserStorageItem(key);

  const storage = mode === 'remember' ? window.localStorage : window.sessionStorage;
  storage.setItem(key, value);
};

const getBrowserStorageItem = (key: string, mode: AuthPersistenceMode) => {
  if (!hasWindow()) {
    return null;
  }

  const storage = mode === 'remember' ? window.localStorage : window.sessionStorage;
  return storage.getItem(key);
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

const getUsersStore = () => getPersistedItem<User[]>(USERS_KEY, localAuthSeedUsers);
const getDocTypesStore = () => getPersistedItem<DocType[]>(DOC_TYPES_KEY, previewDocTypes);
const getDocumentsStore = () => getPersistedItem<DocumentData[]>(DOCUMENTS_KEY, previewDocuments);
const saveUsersStore = (users: User[]) => setPersistedItem(USERS_KEY, users);
const saveDocTypesStore = (docTypes: DocType[]) => setPersistedItem(DOC_TYPES_KEY, docTypes);
const saveDocumentsStore = (documents: DocumentData[]) =>
  setPersistedItem(DOCUMENTS_KEY, documents);
const isCloudDataEnabled = isFirebaseConfigured && Boolean(db);
const isCloudStorageEnabled = isFirebaseConfigured && Boolean(storage);

const ensureFirestoreReady = () => {
  if (!isCloudDataEnabled || !db) {
    throw new Error('firebase_not_configured');
  }

  return db;
};

const ensureStorageReady = () => {
  if (!isCloudStorageEnabled || !storage) {
    throw new Error('firebase_not_configured');
  }

  return storage;
};

const normalizeStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const stripUndefinedDeep = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
      (record, [key, currentValue]) => {
        const nextValue = stripUndefinedDeep(currentValue);

        if (nextValue !== undefined) {
          record[key] = nextValue;
        }

        return record;
      },
      {},
    ) as T;
  }

  return value;
};

const sanitizeStoragePathSegment = (value: string) => {
  const normalized = value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);

  return normalized || 'file';
};

const getDocumentStoragePath = (documentId: string, fileId: string, fileName: string) =>
  `${DOCUMENT_STORAGE_PREFIX}/${documentId}/${fileId}-${sanitizeStoragePathSegment(fileName)}`;

const clearAuthPersistenceMode = () => {
  removeBrowserStorageItem(AUTH_PERSISTENCE_KEY);
};

const setAuthPersistenceMode = (mode: AuthPersistenceMode | null) => {
  if (!mode) {
    clearAuthPersistenceMode();
    return;
  }

  setBrowserStorageItem(AUTH_PERSISTENCE_KEY, mode, mode);
};

const getAuthPersistenceMode = (): AuthPersistenceMode | null => {
  if (!hasWindow()) {
    return null;
  }

  const sessionMode = window.sessionStorage.getItem(AUTH_PERSISTENCE_KEY);

  if (sessionMode === 'session') {
    return sessionMode;
  }

  const localMode = window.localStorage.getItem(AUTH_PERSISTENCE_KEY);

  if (localMode === 'remember') {
    return localMode;
  }

  return null;
};

const clearLocalAuthSession = () => {
  removeBrowserStorageItem(LOCAL_AUTH_SESSION_KEY);
};

const setLocalAuthSession = (userId: string | null, mode?: AuthPersistenceMode) => {
  if (!userId || !mode) {
    clearLocalAuthSession();
    return;
  }

  setBrowserStorageItem(LOCAL_AUTH_SESSION_KEY, userId, mode);
  setAuthPersistenceMode(mode);
};

const getLocalAuthSession = () => {
  const mode = getAuthPersistenceMode();

  if (!mode) {
    clearLocalAuthSession();
    return null;
  }

  const sessionUserId = getBrowserStorageItem(LOCAL_AUTH_SESSION_KEY, mode);

  if (!sessionUserId) {
    clearLocalAuthSession();
    clearAuthPersistenceMode();
    return null;
  }

  return sessionUserId;
};

const normalizeStoredUser = (user: User): User => ({
  ...user,
  username: normalizeIdentity(user.username || user.email),
  email: normalizeIdentity(user.email || user.username),
  name: user.name.trim(),
  role: normalizeRole(user.role),
  password: user.password?.trim() || undefined,
  avatar: user.avatar?.trim() || undefined,
  phone: user.phone?.trim() || undefined,
});

const sortUsersByName = (users: User[]) =>
  [...users].sort((left, right) => left.name.localeCompare(right.name, 'th'));

const mapStoredUsersToPublicUsers = (users: User[]) =>
  sortUsersByName(users)
    .filter((user) => user.username && user.role)
    .map((user) => stripPassword(normalizeStoredUser(user)));

const serializeUserForCloud = (user: User) =>
  stripUndefinedDeep({
    username: normalizeIdentity(user.username || user.email),
    email: normalizeIdentity(user.email || user.username),
    name: user.name.trim(),
    role: normalizeRole(user.role),
    avatar: user.avatar?.trim() || undefined,
    phone: user.phone?.trim() || undefined,
  });

const deserializeUserFromCloud = (id: string, payload: Partial<User> | undefined): User =>
  normalizeStoredUser({
    _id: id,
    username: normalizeIdentity(payload?.username || payload?.email || ''),
    email: normalizeIdentity(payload?.email || payload?.username || ''),
    name: payload?.name?.trim() || payload?.email?.trim() || DEFAULT_USER_LABEL,
    role: normalizeRole(payload?.role),
    avatar: payload?.avatar?.trim() || undefined,
    phone: payload?.phone?.trim() || undefined,
  });

const serializeDocTypeForCloud = (docType: DocType) =>
  stripUndefinedDeep({
    name: docType.name.trim(),
    color: docType.color.trim() || DEFAULT_DOC_TYPE_COLOR,
  });

const deserializeDocTypeFromCloud = (id: string, payload: Partial<DocType> | undefined): DocType => ({
  _id: id,
  name: payload?.name?.trim() || '',
  color: payload?.color?.trim() || DEFAULT_DOC_TYPE_COLOR,
});

const serializeStoredFileForCloud = (file: StoredFile) => {
  const normalized = normalizeStoredFile(file);

  return stripUndefinedDeep({
    originalName: normalized.originalName,
    fileId: normalized.fileId,
    storedName: normalized.storedName,
    path: normalized.path,
    url: normalized.url,
    mimeType: normalized.mimeType,
    size: normalized.size,
    extractedText: normalized.extractedText,
    extractedTextPreview: normalized.extractedTextPreview,
    extractedAt: normalized.extractedAt,
    semanticKeywords: normalizeStringArray(normalized.semanticKeywords),
  });
};

const serializeDocumentForCloud = (document: DocumentData) =>
  stripUndefinedDeep({
    docNo: document.docNo.trim(),
    subject: document.subject.trim(),
    typeId: document.typeId.trim(),
    fiscalYear: Number(document.fiscalYear),
    date: document.date,
    origin: document.origin.trim(),
    resp: document.resp.trim(),
    ownerId: document.ownerId.trim(),
    files: document.files.map((file) => serializeStoredFileForCloud(file)),
    createdAt: document.createdAt,
    searchableContent: document.searchableContent,
    semanticKeywords: normalizeStringArray(document.semanticKeywords),
    contentIndexedAt: document.contentIndexedAt,
  });

const deserializeDocumentFromCloud = (
  id: string,
  payload: Partial<DocumentData> | undefined,
): DocumentData => {
  const files = Array.isArray(payload?.files)
    ? payload.files.map((file) => normalizeStoredFile(file))
    : [];
  const fallbackIndex = buildDocumentSearchIndex({
    docNo: payload?.docNo,
    subject: payload?.subject,
    origin: payload?.origin,
    resp: payload?.resp,
    files,
  });
  const semanticKeywords = normalizeStringArray(payload?.semanticKeywords);

  return {
    _id: id,
    docNo: payload?.docNo?.trim() || '',
    subject: payload?.subject?.trim() || '',
    typeId: payload?.typeId?.trim() || '',
    fiscalYear: Number(payload?.fiscalYear || new Date().getFullYear() + 543),
    date: payload?.date || '',
    origin: payload?.origin?.trim() || '',
    resp: payload?.resp?.trim() || '',
    files,
    ownerId: payload?.ownerId?.trim() || '',
    createdAt: payload?.createdAt || nowIso(),
    searchableContent: payload?.searchableContent?.trim() || fallbackIndex.searchableContent,
    semanticKeywords: semanticKeywords.length > 0 ? semanticKeywords : fallbackIndex.semanticKeywords,
    contentIndexedAt: payload?.contentIndexedAt || fallbackIndex.contentIndexedAt,
  };
};

const createStoredUser = (user: Omit<User, '_id'>): User =>
  normalizeStoredUser({
    ...user,
    _id: createId('user'),
  });

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

const uploadFileToCloud = async (
  documentId: string,
  fileMeta: StoredFile,
  uploadedFile: File,
): Promise<StoredFile> => {
  const cloudStorage = ensureStorageReady();
  const normalized = normalizeStoredFile(fileMeta);
  const fileId = normalized.fileId || normalized.clientId || createId('file');
  const storagePath = getDocumentStoragePath(
    documentId,
    sanitizeStoragePathSegment(fileId),
    normalized.originalName || uploadedFile.name,
  );
  const storageRef = ref(cloudStorage, storagePath);

  await uploadBytes(storageRef, uploadedFile, {
    contentType: uploadedFile.type || normalized.mimeType || undefined,
  });

  const downloadUrl = await getDownloadURL(storageRef);

  return normalizeStoredFile({
    ...normalized,
    fileId,
    storedName: normalized.storedName || uploadedFile.name,
    originalName: normalized.originalName || uploadedFile.name,
    path: storagePath,
    url: downloadUrl,
    mimeType: normalized.mimeType || uploadedFile.type || undefined,
    size: normalized.size || uploadedFile.size,
  });
};

const mapCloudFiles = async (
  documentId: string,
  filesMeta: StoredFile[] = [],
  uploadedFiles: File[] = [],
) => {
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

    if (!isCloudStorageEnabled) {
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
      continue;
    }

    nextFiles.push(await uploadFileToCloud(documentId, normalized, upload));
  }

  while (pendingUploads.length > 0) {
    const upload = pendingUploads.shift();

    if (!upload) {
      continue;
    }

    if (!isCloudStorageEnabled) {
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
      continue;
    }

    nextFiles.push(
      await uploadFileToCloud(
        documentId,
        normalizeStoredFile({
          originalName: upload.name,
          mimeType: upload.type || undefined,
          size: upload.size,
        }),
        upload,
      ),
    );
  }

  return nextFiles;
};

const deleteCloudFiles = async (paths: string[]) => {
  if (!isCloudStorageEnabled || paths.length === 0) {
    return;
  }

  const cloudStorage = ensureStorageReady();

  await Promise.all(
    paths.map(async (path) => {
      try {
        await deleteObject(ref(cloudStorage, path));
      } catch (error) {
        const code = getFirebaseErrorCode(error);

        if (code !== 'storage/object-not-found') {
          throw error;
        }
      }
    }),
  );
};

const ensureFirebaseReady = () => {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('firebase_not_configured');
  }

  return auth;
};

const getFirebaseErrorCode = (error: unknown) =>
  error && typeof error === 'object' && 'code' in error
    ? String((error as { code?: string }).code ?? '')
    : '';

const mapFirebaseError = (error: unknown, fallbackMessage: string) => {
  const code = getFirebaseErrorCode(error);

  switch (code) {
    case 'auth/email-already-in-use':
    case 'already-exists':
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
    case 'storage/retry-limit-exceeded':
    case 'unavailable':
      return new Error('firebase_network_failed');
    case 'auth/too-many-requests':
      return new Error('too_many_requests');
    case 'auth/requires-recent-login':
      return new Error('requires_recent_login');
    case 'permission-denied':
    case 'storage/unauthorized':
      return new Error('firebase_data_access_denied');
    case 'not-found':
      return new Error('record_not_found');
    case 'resource-exhausted':
    case 'storage/quota-exceeded':
      return new Error('firebase_quota_exceeded');
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

const syncLocalProfileFromFirebaseAuth = async (
  firebaseUser: FirebaseAuthUser,
  fallbackName?: string,
  fallbackRole?: User['role'],
) => {
  const users = (await getUsersStore()).map(normalizeStoredUser);
  const existingUser = users.find((user) => user._id === firebaseUser.uid);
  const identity = normalizeIdentity(firebaseUser.email || existingUser?.email || '');
  const nextUser = normalizeStoredUser({
    _id: firebaseUser.uid,
    username: identity,
    email: identity,
    name:
      firebaseUser.displayName?.trim() ||
      fallbackName?.trim() ||
      existingUser?.name ||
      identity ||
      'ผู้ใช้งาน',
    role: existingUser?.role || normalizeRole(fallbackRole || 'general'),
    avatar: firebaseUser.photoURL || existingUser?.avatar,
    phone: existingUser?.phone,
    password: existingUser?.password,
  });

  const nextUsers = existingUser
    ? users.map((user) => (user._id === firebaseUser.uid ? nextUser : user))
    : [nextUser, ...users];

  await saveUsersStore(nextUsers);
  return stripPassword(nextUser);
};

const syncCloudProfileFromFirebaseAuth = async (
  firebaseUser: FirebaseAuthUser,
  fallbackName?: string,
  fallbackRole?: User['role'],
) => {
  const firestore = ensureFirestoreReady();
  const userRef = doc(firestore, FIRESTORE_USERS_COLLECTION, firebaseUser.uid);
  const snapshot = await getDoc(userRef);
  const existingUser = snapshot.exists()
    ? deserializeUserFromCloud(snapshot.id, snapshot.data() as Partial<User>)
    : null;
  const identity = normalizeIdentity(firebaseUser.email || existingUser?.email || '');
  const nextUser = normalizeStoredUser({
    _id: firebaseUser.uid,
    username: identity,
    email: identity,
    name:
      firebaseUser.displayName?.trim() ||
      fallbackName?.trim() ||
      existingUser?.name ||
      identity ||
      DEFAULT_USER_LABEL,
    role: existingUser?.role || normalizeRole(fallbackRole || 'general'),
    avatar: firebaseUser.photoURL || existingUser?.avatar,
    phone: existingUser?.phone,
  });

  await setDoc(userRef, serializeUserForCloud(nextUser), { merge: true });

  return stripPassword(nextUser);
};

const syncProfileFromFirebaseAuth = async (
  firebaseUser: FirebaseAuthUser,
  fallbackName?: string,
  fallbackRole?: User['role'],
) => {
  if (!isCloudDataEnabled) {
    return syncLocalProfileFromFirebaseAuth(firebaseUser, fallbackName, fallbackRole);
  }

  try {
    return await syncCloudProfileFromFirebaseAuth(firebaseUser, fallbackName, fallbackRole);
  } catch (error) {
    throw mapFirebaseError(error, 'firebase_profile_access_denied');
  }
};

const loginWithLocalAuth = async (
  username: string,
  password: string,
  rememberMe: boolean,
): Promise<{ user: User; token: string }> => {
  const identity = normalizeIdentity(username);
  const users = (await getUsersStore()).map(normalizeStoredUser);
  const matchedUser = users.find(
    (user) =>
      (normalizeIdentity(user.email || user.username) === identity ||
        normalizeIdentity(user.username || user.email) === identity) &&
      (user.password || '') === password.trim(),
  );

  if (!matchedUser) {
    throw new Error('invalid_credentials');
  }

  setLocalAuthSession(matchedUser._id, rememberMe ? 'remember' : 'session');

  return {
    user: stripPassword(matchedUser),
    token: '',
  };
};

const verifyLocalSession = async (): Promise<User | null> => {
  const sessionUserId = getLocalAuthSession();

  if (!sessionUserId) {
    return null;
  }

  const users = (await getUsersStore()).map(normalizeStoredUser);
  const matchedUser = users.find((user) => user._id === sessionUserId);

  if (!matchedUser) {
    setLocalAuthSession(null);
    clearAuthPersistenceMode();
    return null;
  }

  return stripPassword(matchedUser);
};

const registerWithLocalAuth = async (
  userData: Omit<User, '_id'>,
): Promise<{ user: User; token: string }> => {
  const email = normalizeIdentity(userData.email || userData.username);
  const password = (userData.password || '').trim();
  const name = (userData.name || '').trim();
  const users = (await getUsersStore()).map(normalizeStoredUser);

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

  const duplicate = users.some(
    (user) =>
      normalizeIdentity(user.email || user.username) === email ||
      normalizeIdentity(user.username || user.email) === email,
  );

  if (duplicate) {
    throw new Error('duplicate_record');
  }

  const nextUser = createStoredUser({
    username: email,
    email,
    password,
    name,
    role: normalizeRole(userData.role || 'general'),
    avatar: userData.avatar,
    phone: userData.phone,
  });

  await saveUsersStore([nextUser, ...users]);

  return {
    user: stripPassword(nextUser),
    token: '',
  };
};

const saveLocalUser = async (payload: SaveUserInput, id?: string) => {
  const users = (await getUsersStore()).map(normalizeStoredUser);

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

    if (
      users.some(
        (user) =>
          normalizeIdentity(user.email || user.username) === email ||
          normalizeIdentity(user.username || user.email) === email,
      )
    ) {
      throw new Error('duplicate_record');
    }

    const nextUser = createStoredUser({
      username: email,
      email,
      password,
      name,
      role: normalizeRole(payload.role || 'officer'),
      avatar: payload.avatar,
      phone: payload.phone,
    });

    await saveUsersStore([nextUser, ...users]);
    return stripPassword(nextUser);
  }

  const existingUser = users.find((user) => user._id === id);

  if (!existingUser) {
    throw new Error('ไม่พบข้อมูลผู้ใช้');
  }

  const nextIdentity = payload.username || payload.email;
  const normalizedNextIdentity =
    nextIdentity !== undefined
      ? normalizeIdentity(nextIdentity)
      : normalizeIdentity(existingUser.email || existingUser.username);

  if (
    users.some(
      (user) =>
        user._id !== id &&
        (normalizeIdentity(user.email || user.username) === normalizedNextIdentity ||
          normalizeIdentity(user.username || user.email) === normalizedNextIdentity),
    )
  ) {
    throw new Error('duplicate_record');
  }

  const nextUser = normalizeStoredUser({
    ...existingUser,
    username: normalizedNextIdentity,
    email: normalizedNextIdentity,
    name: payload.name !== undefined ? payload.name : existingUser.name,
    role: payload.role !== undefined ? payload.role : existingUser.role,
    password: payload.password?.trim() || existingUser.password,
    avatar: payload.avatar !== undefined ? payload.avatar : existingUser.avatar,
    phone: payload.phone !== undefined ? payload.phone : existingUser.phone,
  });

  await saveUsersStore(users.map((user) => (user._id === id ? nextUser : user)));
  return stripPassword(nextUser);
};

const updateFirebaseCurrentUserProfile = async (id: string, payload: SaveUserInput, nextUser: User) => {
  if (!isFirebaseConfigured || !auth || auth.currentUser?.uid !== id) {
    return;
  }

  try {
    if (payload.password?.trim()) {
      await updatePassword(auth.currentUser, payload.password.trim());
    }

    if (
      nextUser.name !== (auth.currentUser.displayName || '').trim() ||
      nextUser.avatar !== (auth.currentUser.photoURL || undefined)
    ) {
      await updateProfile(auth.currentUser, {
        displayName: nextUser.name,
        photoURL: nextUser.avatar || null,
      });
    }
  } catch (error) {
    throw mapFirebaseError(error, 'ไม่สามารถบันทึกข้อมูลผู้ใช้ได้');
  }
};

const deleteLocalUser = async (id: string) => {
  const sessionUserId = getLocalAuthSession();

  if (sessionUserId === id) {
    throw new Error('ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่ได้');
  }

  const users = await getUsersStore();

  if (!users.some((user) => user._id === id)) {
    throw new Error('ไม่พบข้อมูลผู้ใช้');
  }

  await saveUsersStore(users.filter((user) => user._id !== id));
  return true;
};

const getCloudUsers = async () => {
  const firestore = ensureFirestoreReady();
  const snapshot = await getDocs(collection(firestore, FIRESTORE_USERS_COLLECTION));

  return mapStoredUsersToPublicUsers(
    snapshot.docs.map((item) => deserializeUserFromCloud(item.id, item.data() as Partial<User>)),
  );
};

const saveCloudUser = async (payload: SaveUserInput, id?: string) => {
  const firestore = ensureFirestoreReady();

  if (!id) {
    throw new Error('firebase_user_creation_requires_backend');
  }

  const userRef = doc(firestore, FIRESTORE_USERS_COLLECTION, id);
  const existingSnapshot = await getDoc(userRef);
  const existingUser = existingSnapshot.exists()
    ? deserializeUserFromCloud(existingSnapshot.id, existingSnapshot.data() as Partial<User>)
    : auth?.currentUser?.uid === id
      ? normalizeStoredUser({
          _id: id,
          username: normalizeIdentity(auth.currentUser.email || ''),
          email: normalizeIdentity(auth.currentUser.email || ''),
          name: auth.currentUser.displayName?.trim() || DEFAULT_USER_LABEL,
          role: 'general',
          avatar: auth.currentUser.photoURL || undefined,
        })
      : null;

  if (!existingUser) {
    throw new Error('record_not_found');
  }

  const nextIdentity = payload.username || payload.email;
  const normalizedNextIdentity =
    nextIdentity !== undefined
      ? normalizeIdentity(nextIdentity)
      : normalizeIdentity(existingUser.email || existingUser.username);

  if (normalizedNextIdentity) {
    const duplicateQuery = query(
      collection(firestore, FIRESTORE_USERS_COLLECTION),
      where('email', '==', normalizedNextIdentity),
      limit(1),
    );
    const duplicateSnapshot = await getDocs(duplicateQuery);

    if (duplicateSnapshot.docs.some((item) => item.id !== id)) {
      throw new Error('duplicate_record');
    }
  }

  const nextUser = normalizeStoredUser({
    ...existingUser,
    username: normalizedNextIdentity || existingUser.username,
    email: normalizedNextIdentity || existingUser.email,
    name: payload.name !== undefined ? payload.name : existingUser.name,
    role: payload.role !== undefined ? payload.role : existingUser.role,
    avatar: payload.avatar !== undefined ? payload.avatar : existingUser.avatar,
    phone: payload.phone !== undefined ? payload.phone : existingUser.phone,
  });

  if (auth?.currentUser?.uid === id) {
    await updateFirebaseCurrentUserProfile(id, payload, nextUser);
  }

  await setDoc(userRef, serializeUserForCloud(nextUser), { merge: true });

  return stripPassword(nextUser);
};

const deleteCloudUser = async (_id: string) => {
  throw new Error('firebase_user_deletion_requires_backend');
};

const getCloudDocTypes = async () => {
  const firestore = ensureFirestoreReady();
  const snapshot = await getDocs(collection(firestore, FIRESTORE_DOC_TYPES_COLLECTION));

  return snapshot.docs
    .map((item) => deserializeDocTypeFromCloud(item.id, item.data() as Partial<DocType>))
    .sort((left, right) => left.name.localeCompare(right.name, 'th'));
};

const saveCloudDocType = async (payload: SaveDocTypeInput, id?: string) => {
  const firestore = ensureFirestoreReady();
  const name = (payload.name || '').trim();
  const color = (payload.color || DEFAULT_DOC_TYPE_COLOR).trim();

  if (!name) {
    throw new Error('กรุณาระบุชื่อประเภทเอกสาร');
  }

  const nextDocType: DocType = {
    _id: id || createId('doctype'),
    name,
    color,
  };

  await setDoc(
    doc(firestore, FIRESTORE_DOC_TYPES_COLLECTION, nextDocType._id),
    serializeDocTypeForCloud(nextDocType),
    { merge: true },
  );

  return nextDocType;
};

const deleteCloudDocType = async (id: string) => {
  const firestore = ensureFirestoreReady();
  const linkedDocuments = await getDocs(
    query(
      collection(firestore, FIRESTORE_DOCUMENTS_COLLECTION),
      where('typeId', '==', id),
      limit(1),
    ),
  );

  if (!linkedDocuments.empty) {
    throw new Error('ไม่สามารถลบประเภทเอกสารที่ถูกใช้งานอยู่ได้');
  }

  await deleteDoc(doc(firestore, FIRESTORE_DOC_TYPES_COLLECTION, id));
  return true;
};

const getCloudDocuments = async () => {
  const firestore = ensureFirestoreReady();
  const snapshot = await getDocs(collection(firestore, FIRESTORE_DOCUMENTS_COLLECTION));

  return snapshot.docs
    .map((item) =>
      deserializeDocumentFromCloud(item.id, item.data() as Partial<DocumentData>),
    )
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
};

const saveCloudDocument = async (payload: SaveDocumentInput, id?: string) => {
  const firestore = ensureFirestoreReady();
  const documentId = id || createId('document');
  const documentRef = doc(firestore, FIRESTORE_DOCUMENTS_COLLECTION, documentId);
  const existingSnapshot = id ? await getDoc(documentRef) : null;
  const existingDocument =
    existingSnapshot && existingSnapshot.exists()
      ? deserializeDocumentFromCloud(
          existingSnapshot.id,
          existingSnapshot.data() as Partial<DocumentData>,
        )
      : null;

  if (id && !existingDocument) {
    throw new Error('record_not_found');
  }

  const nextFiles = await mapCloudFiles(
    documentId,
    payload.files ?? [],
    payload.uploadedFiles ?? [],
  );
  const indexed = buildDocumentSearchIndex({
    docNo: payload.docNo,
    subject: payload.subject,
    origin: payload.origin,
    resp: payload.resp,
    files: nextFiles,
  });
  const timestamp = nowIso();
  const nextDocument: DocumentData = {
    _id: documentId,
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

  await setDoc(documentRef, serializeDocumentForCloud(nextDocument), { merge: true });

  if (existingDocument) {
    const nextPaths = new Set(
      nextDocument.files
        .map((file) => file.path?.trim())
        .filter((path): path is string => Boolean(path)),
    );
    const removedPaths = existingDocument.files
      .map((file) => file.path?.trim() || '')
      .filter((path) => Boolean(path) && !nextPaths.has(path));

    await deleteCloudFiles(removedPaths);
  }

  return nextDocument;
};

const deleteCloudDocument = async (id: string) => {
  const firestore = ensureFirestoreReady();
  const documentRef = doc(firestore, FIRESTORE_DOCUMENTS_COLLECTION, id);
  const snapshot = await getDoc(documentRef);

  if (snapshot.exists()) {
    const existingDocument = deserializeDocumentFromCloud(
      snapshot.id,
      snapshot.data() as Partial<DocumentData>,
    );
    const storedPaths = existingDocument.files
      .map((file) => file.path?.trim())
      .filter((path): path is string => Boolean(path));

    await deleteDoc(documentRef);
    await deleteCloudFiles(storedPaths);
    return true;
  }

  await deleteDoc(documentRef);
  return true;
};

export const api = {
  login: async (
    username: string,
    password: string,
    rememberMe = false,
  ): Promise<{ user: User; token: string }> => {
    if (!isFirebaseConfigured) {
      return loginWithLocalAuth(username, password, rememberMe);
    }

    const firebaseAuth = ensureFirebaseReady();
    const email = normalizeIdentity(username);

    try {
      await configureFirebasePersistence(rememberMe);
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);

      if (!credential.user.emailVerified) {
        await signOut(firebaseAuth);
        clearAuthPersistenceMode();
        throw new Error('email_not_verified');
      }

      setAuthPersistenceMode(rememberMe ? 'remember' : 'session');

      return {
        user: await syncProfileFromFirebaseAuth(credential.user),
        token: '',
      };
    } catch (error) {
      clearAuthPersistenceMode();
      throw mapFirebaseError(error, 'ไม่สามารถเข้าสู่ระบบได้');
    }
  },

  verifySession: async (): Promise<User | null> => {
    if (!isFirebaseConfigured || !auth) {
      return verifyLocalSession();
    }

    const persistenceMode = getAuthPersistenceMode();
    const firebaseUser = await resolveCurrentFirebaseUser();

    if (!persistenceMode) {
      if (firebaseUser) {
        await signOut(auth).catch(() => undefined);
      }

      return null;
    }

    if (!firebaseUser) {
      return null;
    }

    try {
      await firebaseUser.reload();
      const currentFirebaseUser = auth.currentUser ?? firebaseUser;

      if (!currentFirebaseUser.emailVerified) {
        await signOut(auth);
        clearAuthPersistenceMode();
        return null;
      }

      return syncProfileFromFirebaseAuth(currentFirebaseUser);
    } catch {
      return null;
    }
  },

  logout: () => {
    setLocalAuthSession(null);
    clearAuthPersistenceMode();

    if (auth) {
      void signOut(auth);
    }
  },

  requestPasswordReset: async (email: string) => {
    if (!isFirebaseConfigured) {
      throw new Error('local_password_reset_not_supported');
    }

    const firebaseAuth = ensureFirebaseReady();

    try {
      await sendPasswordResetEmail(firebaseAuth, normalizeIdentity(email));
      return true;
    } catch (error) {
      throw mapFirebaseError(error, 'ไม่สามารถส่งอีเมลรีเซ็ตรหัสผ่านได้');
    }
  },

  register: async (userData: Omit<User, '_id'>): Promise<{ user: User; token: string }> => {
    if (!isFirebaseConfigured) {
      return registerWithLocalAuth(userData);
    }

    const firebaseAuth = ensureFirebaseReady();
    const email = normalizeIdentity(userData.email || userData.username);
    const password = (userData.password || '').trim();
    const name = (userData.name || '').trim();
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

      const user = await syncProfileFromFirebaseAuth(
        credential.user,
        name,
        normalizeRole(userData.role || 'general'),
      );

      await sendEmailVerification(credential.user);
      await signOut(firebaseAuth);

      return {
        user,
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
    if (!isCloudDataEnabled) {
      return mapStoredUsersToPublicUsers(await getUsersStore());
    }

    try {
      return await getCloudUsers();
    } catch (error) {
      throw mapFirebaseError(error, 'ไม่สามารถโหลดข้อมูลผู้ใช้งานได้');
    }
  },

  saveUser: async (payload: SaveUserInput, id?: string) => {
    if (!isCloudDataEnabled) {
      const savedUser = await saveLocalUser(payload, id);

      if (id) {
        await updateFirebaseCurrentUserProfile(id, payload, savedUser);
      }

      return savedUser;
    }

    try {
      return await saveCloudUser(payload, id);
    } catch (error) {
      throw mapFirebaseError(error, 'ไม่สามารถบันทึกข้อมูลผู้ใช้งานได้');
    }
  },

  deleteUser: async (id: string) => {
    if (!isCloudDataEnabled) {
      return deleteLocalUser(id);
    }

    try {
      return await deleteCloudUser(id);
    } catch (error) {
      throw mapFirebaseError(error, 'ไม่สามารถลบผู้ใช้งานได้');
    }
  },

  getDocTypes: async () => {
    if (!isCloudDataEnabled) {
      return [...(await getDocTypesStore())].sort((left, right) =>
        left.name.localeCompare(right.name, 'th'),
      );
    }

    try {
      return await getCloudDocTypes();
    } catch (error) {
      throw mapFirebaseError(error, 'ไม่สามารถโหลดประเภทเอกสารได้');
    }
  },

  saveDocType: async (payload: SaveDocTypeInput, id?: string) => {
    if (!isCloudDataEnabled) {
      const docTypes = await getDocTypesStore();
      const name = (payload.name || '').trim();
      const color = (payload.color || DEFAULT_DOC_TYPE_COLOR).trim();

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
    }

    try {
      return await saveCloudDocType(payload, id);
    } catch (error) {
      throw mapFirebaseError(error, 'ไม่สามารถบันทึกประเภทเอกสารได้');
    }
  },

  deleteDocType: async (id: string) => {
    if (!isCloudDataEnabled) {
      const documents = await getDocumentsStore();

      if (documents.some((document) => document.typeId === id)) {
        throw new Error('ไม่สามารถลบประเภทเอกสารที่ถูกใช้งานอยู่ได้');
      }

      await saveDocTypesStore((await getDocTypesStore()).filter((docType) => docType._id !== id));
      return true;
    }

    try {
      return await deleteCloudDocType(id);
    } catch (error) {
      throw mapFirebaseError(error, 'ไม่สามารถลบประเภทเอกสารได้');
    }
  },

  getDocuments: async () => {
    if (!isCloudDataEnabled) {
      return [...(await getDocumentsStore())].sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt),
      );
    }

    try {
      return await getCloudDocuments();
    } catch (error) {
      throw mapFirebaseError(error, 'ไม่สามารถโหลดเอกสารได้');
    }
  },

  saveDocument: async (payload: SaveDocumentInput, id?: string) => {
    if (!isCloudDataEnabled) {
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
      const timestamp = nowIso();
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
    }

    try {
      return await saveCloudDocument(payload, id);
    } catch (error) {
      throw mapFirebaseError(error, 'ไม่สามารถบันทึกเอกสารได้');
    }
  },

  deleteDocument: async (id: string) => {
    if (!isCloudDataEnabled) {
      await saveDocumentsStore((await getDocumentsStore()).filter((document) => document._id !== id));
      return true;
    }

    try {
      return await deleteCloudDocument(id);
    } catch (error) {
      throw mapFirebaseError(error, 'ไม่สามารถลบเอกสารได้');
    }
  },
};
