import { previewDocTypes, previewDocuments, previewUsers } from '../app/previewData';
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
import { buildDocumentSearchIndex, normalizeStoredFile } from '../utils/documentSearch';

const USERS_KEY = 'milosystem:users';
const SESSION_USER_ID_KEY = 'milosystem:sessionUserId';
const DOC_TYPES_KEY = 'milosystem:docTypes';
const DOCUMENTS_KEY = 'milosystem:documents';
const LOCAL_DB_NAME = 'milosystem-local-db';
const LOCAL_DB_VERSION = 1;
const LOCAL_DB_STORE = 'app-data';
const DEFAULT_PASSWORD = '1234';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

let localDbPromise: Promise<IDBDatabase | null> | null = null;

const defaultUsers: User[] = previewUsers.map((user) => ({
  ...user,
  email: user.email || user.username,
  password: user.password || DEFAULT_PASSWORD,
}));

const hasWindow = () => typeof window !== 'undefined';

const normalizeRole = (role?: string): UserRole =>
  role === 'admin' || role === 'officer' || role === 'general' ? role : 'general';

const normalizeIdentity = (value?: string) => (value || '').trim().toLowerCase();

const createId = (prefix: string) =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const stripPassword = (user: User): User => {
  const { password, ...safeUser } = user;
  return safeUser;
};

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

const getUsersStore = () => getPersistedItem<User[]>(USERS_KEY, defaultUsers);
const saveUsersStore = (users: User[]) => setPersistedItem(USERS_KEY, users);
const getSessionUserId = () => getPersistedItem<string | null>(SESSION_USER_ID_KEY, null);
const saveSessionUserId = (userId: string | null) => setPersistedItem(SESSION_USER_ID_KEY, userId);
const getDocTypesStore = () => getPersistedItem<DocType[]>(DOC_TYPES_KEY, previewDocTypes);
const getDocumentsStore = () => getPersistedItem<DocumentData[]>(DOCUMENTS_KEY, previewDocuments);
const saveDocTypesStore = (docTypes: DocType[]) => setPersistedItem(DOC_TYPES_KEY, docTypes);
const saveDocumentsStore = (documents: DocumentData[]) =>
  setPersistedItem(DOCUMENTS_KEY, documents);

const ensureUniqueUserIdentity = (users: User[], username: string, ignoreId?: string) => {
  const normalizedUsername = normalizeIdentity(username);
  const duplicated = users.some(
    (user) =>
      user._id !== ignoreId &&
      (normalizeIdentity(user.username) === normalizedUsername ||
        normalizeIdentity(user.email) === normalizedUsername),
  );

  if (duplicated) {
    throw new Error('duplicate_record');
  }
};

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

export const localAppService = {
  login: async (username: string, password: string): Promise<{ user: User; token: string }> => {
    const users = await getUsersStore();
    const normalizedUsername = normalizeIdentity(username);
    const matchedUser = users.find(
      (user) =>
        normalizeIdentity(user.username) === normalizedUsername ||
        normalizeIdentity(user.email) === normalizedUsername,
    );

    if (!matchedUser || (matchedUser.password || '') !== password) {
      throw new Error('invalid_credentials');
    }

    await saveSessionUserId(matchedUser._id);

    return {
      user: stripPassword(matchedUser),
      token: '',
    };
  },

  verifySession: async (): Promise<User | null> => {
    const [users, currentUserId] = await Promise.all([getUsersStore(), getSessionUserId()]);
    const matchedUser = users.find((user) => user._id === currentUserId);
    return matchedUser ? stripPassword(matchedUser) : null;
  },

  logout: () => {
    void saveSessionUserId(null);
  },

  requestPasswordReset: async (email: string) => {
    const users = await getUsersStore();
    const normalizedEmail = normalizeIdentity(email);
    const matchedUser = users.find(
      (user) =>
        normalizeIdentity(user.email) === normalizedEmail ||
        normalizeIdentity(user.username) === normalizedEmail,
    );

    if (!matchedUser) {
      throw new Error('ไม่พบบัญชีผู้ใช้นี้ในระบบ');
    }

    const nextUsers = users.map((user) =>
      user._id === matchedUser._id ? { ...user, password: DEFAULT_PASSWORD } : user,
    );
    await saveUsersStore(nextUsers);
    return DEFAULT_PASSWORD;
  },

  register: async (userData: Omit<User, '_id'>): Promise<{ user: User; token: string }> => {
    const users = await getUsersStore();
    const email = normalizeIdentity(userData.email || userData.username);
    const password = (userData.password || '').trim();
    const name = (userData.name || '').trim();

    if (!email) {
      throw new Error('กรุณากรอกอีเมล');
    }

    if (!password) {
      throw new Error('กรุณากรอกรหัสผ่าน');
    }

    if (!name) {
      throw new Error('กรุณากรอกชื่อผู้ใช้งาน');
    }

    ensureUniqueUserIdentity(users, email);

    const nextUser: User = {
      _id: createId('user'),
      username: email,
      password,
      name,
      role: 'general',
      phone: userData.phone?.trim() || undefined,
      avatar: userData.avatar?.trim() || undefined,
      email,
    };

    await saveUsersStore([nextUser, ...users]);

    return {
      user: stripPassword(nextUser),
      token: '',
    };
  },

  getUsers: async () =>
    (await getUsersStore())
      .map((user) => stripPassword(user))
      .sort((left, right) => left.name.localeCompare(right.name, 'th')),

  saveUser: async (payload: SaveUserInput, id?: string) => {
    const users = await getUsersStore();

    if (!id) {
      const username = normalizeIdentity(payload.email || payload.username);
      const password = (payload.password || '').trim();
      const name = (payload.name || '').trim();

      if (!username || !password || !name) {
        throw new Error('กรุณากรอกชื่อผู้ใช้ ชื่อ และรหัสผ่านให้ครบ');
      }

      ensureUniqueUserIdentity(users, username);

      const nextUser: User = {
        _id: createId('user'),
        username,
        email: username,
        password,
        name,
        role: normalizeRole(payload.role),
        avatar: payload.avatar?.trim() || undefined,
        phone: payload.phone?.trim() || undefined,
      };

      await saveUsersStore([nextUser, ...users]);
      return stripPassword(nextUser);
    }

    const existingUser = users.find((user) => user._id === id);

    if (!existingUser) {
      throw new Error('ไม่พบข้อมูลผู้ใช้');
    }

    const nextUsername = normalizeIdentity(payload.email || payload.username || existingUser.username);
    ensureUniqueUserIdentity(users, nextUsername, id);

    const nextUser: User = {
      ...existingUser,
      username: nextUsername,
      email: nextUsername,
      name: payload.name !== undefined ? payload.name.trim() : existingUser.name,
      role: payload.role !== undefined ? normalizeRole(payload.role) : existingUser.role,
      avatar: payload.avatar !== undefined ? payload.avatar.trim() || undefined : existingUser.avatar,
      phone: payload.phone !== undefined ? payload.phone.trim() || undefined : existingUser.phone,
      password: payload.password?.trim() ? payload.password.trim() : existingUser.password,
    };

    await saveUsersStore(users.map((user) => (user._id === id ? nextUser : user)));
    return stripPassword(nextUser);
  },

  deleteUser: async (id: string) => {
    const users = await getUsersStore();
    const currentUserId = await getSessionUserId();
    const nextUsers = users.filter((user) => user._id !== id);

    if (nextUsers.length === users.length) {
      throw new Error('ไม่พบข้อมูลผู้ใช้');
    }

    await saveUsersStore(nextUsers);

    if (currentUserId === id) {
      await saveSessionUserId(null);
    }

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
