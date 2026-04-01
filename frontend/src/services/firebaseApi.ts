import {
  createUserWithEmailAndPassword,
  deleteUser as deleteCurrentAuthUser,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';

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
import {
  createSecondaryFirebaseApp,
  disposeFirebaseApp,
  getFirebaseAuth,
  getFirebaseDb,
  getFirebaseStorage,
  hasFirebaseConfig,
} from './firebaseConfig';

const USERS_COLLECTION = 'appUsers';
const DOCTYPES_COLLECTION = 'docTypes';
const DOCUMENTS_COLLECTION = 'documents';

const DEFAULT_DOCTYPES: DocType[] = [
  { _id: 'doctype-order', name: 'คำสั่ง', color: '#1e3a8a' },
  { _id: 'doctype-memo', name: 'บันทึกข้อความ', color: '#16a34a' },
  { _id: 'doctype-announcement', name: 'ประกาศ', color: '#f59e0b' },
  { _id: 'doctype-official-letter', name: 'หนังสือราชการ', color: '#3b82f6' },
];

const nowIso = () => new Date().toISOString();

const normalizeRole = (role?: string): UserRole =>
  role === 'admin' || role === 'officer' || role === 'general' ? role : 'general';

const getFieldString = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value : fallback;

const toIsoString = (value: unknown, fallback = nowIso()) => {
  if (typeof value === 'string' && value) {
    return value;
  }

  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate?: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  return fallback;
};

const ensureFirebaseEnabled = () => {
  if (!hasFirebaseConfig) {
    throw new Error(
      'ยังไม่ได้ตั้งค่า Firebase สำหรับ frontend กรุณาเพิ่มค่าใน frontend/.env.local ก่อน',
    );
  }
};

const sanitizeUserRecord = (
  id: string,
  data: Partial<User> & { createdAt?: unknown; updatedAt?: unknown },
): User => ({
  _id: id,
  username: getFieldString(data.username, getFieldString(data.email, id)),
  name: getFieldString(data.name, getFieldString(data.email, 'ผู้ใช้งาน')),
  role: normalizeRole(data.role),
  avatar: typeof data.avatar === 'string' ? data.avatar : undefined,
  phone: typeof data.phone === 'string' ? data.phone : undefined,
  email: typeof data.email === 'string' ? data.email : undefined,
});

const sanitizeDocTypeRecord = (id: string, data: Partial<DocType>): DocType => ({
  _id: id,
  name: getFieldString(data.name),
  color: getFieldString(data.color, '#1e3a8a'),
});

const sanitizeStoredFile = (file: StoredFile): StoredFile => {
  const normalized = normalizeStoredFile(file);
  return {
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
    semanticKeywords: [...(normalized.semanticKeywords ?? [])],
  };
};

const sanitizeDocumentRecord = (
  id: string,
  data: Partial<DocumentData> & {
    createdAt?: unknown;
    updatedAt?: unknown;
    files?: StoredFile[];
  },
): DocumentData => ({
  _id: id,
  docNo: getFieldString(data.docNo),
  subject: getFieldString(data.subject),
  typeId: getFieldString(data.typeId),
  fiscalYear:
    typeof data.fiscalYear === 'number'
      ? data.fiscalYear
      : Number(data.fiscalYear || new Date().getFullYear() + 543),
  date: getFieldString(data.date),
  origin: getFieldString(data.origin),
  resp: getFieldString(data.resp),
  files: (data.files ?? []).map((file) => sanitizeStoredFile(file)),
  ownerId: getFieldString(data.ownerId),
  createdAt: toIsoString(data.createdAt),
  searchableContent: getFieldString(data.searchableContent) || undefined,
  semanticKeywords: Array.isArray(data.semanticKeywords)
    ? data.semanticKeywords.filter((keyword): keyword is string => typeof keyword === 'string')
    : [],
  contentIndexedAt: data.contentIndexedAt ? toIsoString(data.contentIndexedAt) : undefined,
});

const buildUserRecord = ({
  email,
  name,
  role,
  username,
  avatar,
  phone,
  createdAt,
}: {
  avatar?: string;
  createdAt?: string;
  email: string;
  name: string;
  phone?: string;
  role?: string;
  username?: string;
}) => {
  const timestamp = nowIso();

  return {
    username: (username || email).trim().toLowerCase(),
    email: email.trim().toLowerCase(),
    name: name.trim(),
    role: normalizeRole(role),
    avatar: avatar?.trim() || '',
    phone: phone?.trim() || '',
    createdAt: createdAt || timestamp,
    updatedAt: timestamp,
  };
};

let initialAuthResolved = false;
let initialAuthPromise: Promise<void> | null = null;

const waitForInitialAuthState = async () => {
  ensureFirebaseEnabled();

  if (initialAuthResolved) {
    return;
  }

  if (!initialAuthPromise) {
    const auth = getFirebaseAuth();
    initialAuthPromise = new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, () => {
        initialAuthResolved = true;
        unsubscribe();
        resolve();
      });
    });
  }

  await initialAuthPromise;
};

const getProfileRef = (userId: string) => doc(getFirebaseDb(), USERS_COLLECTION, userId);

const syncUserProfile = async (
  userId: string,
  payload: {
    avatar?: string;
    createdAt?: string;
    email: string;
    name: string;
    phone?: string;
    role?: string;
    username?: string;
  },
) => {
  const profileRef = getProfileRef(userId);
  const snapshot = await getDoc(profileRef);
  const existing = snapshot.exists() ? snapshot.data() : {};
  const nextRecord = {
    ...existing,
    ...buildUserRecord({
      createdAt: toIsoString(existing.createdAt, payload.createdAt || nowIso()),
      email: payload.email,
      name: payload.name,
      phone: payload.phone ?? getFieldString(existing.phone),
      role: payload.role ?? getFieldString(existing.role),
      username: payload.username ?? getFieldString(existing.username, payload.email),
      avatar: payload.avatar ?? getFieldString(existing.avatar),
    }),
  };

  await setDoc(profileRef, nextRecord, { merge: true });
  return sanitizeUserRecord(userId, nextRecord);
};

const ensureCurrentUserProfile = async () => {
  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser;

  if (!currentUser || !currentUser.email) {
    return null;
  }

  return syncUserProfile(currentUser.uid, {
    avatar: currentUser.photoURL || undefined,
    email: currentUser.email,
    name: currentUser.displayName || currentUser.email.split('@')[0] || 'ผู้ใช้งาน',
    username: currentUser.email,
  });
};

const ensureDefaultDocTypes = async () => {
  const db = getFirebaseDb();
  const collectionRef = collection(db, DOCTYPES_COLLECTION);
  const snapshot = await getDocs(collectionRef);

  if (!snapshot.empty) {
    return snapshot.docs
      .map((docSnapshot) => sanitizeDocTypeRecord(docSnapshot.id, docSnapshot.data()))
      .sort((left, right) => left.name.localeCompare(right.name, 'th'));
  }

  const batch = writeBatch(db);
  const timestamp = nowIso();

  DEFAULT_DOCTYPES.forEach((docType) => {
    batch.set(doc(db, DOCTYPES_COLLECTION, docType._id), {
      name: docType.name,
      color: docType.color,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  await batch.commit();
  return DEFAULT_DOCTYPES.slice().sort((left, right) => left.name.localeCompare(right.name, 'th'));
};

const resolveLoginEmail = async (usernameOrEmail: string) => {
  const normalizedValue = usernameOrEmail.trim().toLowerCase();
  return normalizedValue;
};

const createStorageFilePath = (documentId: string, ownerId: string, fileName: string) => {
  const extensionMatch = fileName.match(/(\.[a-z0-9]+)$/i);
  const extension = extensionMatch?.[1] ?? '';
  const safeId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `documents/${ownerId || 'anonymous'}/${documentId}/${safeId}${extension}`;
};

const getStoredFileKey = (file: StoredFile) =>
  file.path || file.fileId || file.url || `${file.originalName}:${file.size || 0}`;

const uploadNewFile = async ({
  documentId,
  file,
  meta,
  ownerId,
}: {
  documentId: string;
  file: File;
  meta: StoredFile;
  ownerId: string;
}) => {
  const storage = getFirebaseStorage();
  const storagePath = createStorageFilePath(documentId, ownerId, meta.originalName || file.name);
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file, {
    contentType: meta.mimeType || file.type || 'application/octet-stream',
  });

  const url = await getDownloadURL(storageRef);

  return sanitizeStoredFile({
    ...meta,
    originalName: meta.originalName || file.name,
    fileId: storagePath,
    storedName: meta.originalName || file.name,
    path: storagePath,
    url,
    mimeType: meta.mimeType || file.type || undefined,
    size: meta.size || file.size,
  });
};

const deleteStorageFiles = async (files: StoredFile[]) => {
  const storage = getFirebaseStorage();

  await Promise.all(
    files
      .map((file) => file.path)
      .filter((path): path is string => Boolean(path))
      .map(async (path) => {
        try {
          await deleteObject(ref(storage, path));
        } catch {
          // Ignore orphan cleanup failures.
        }
      }),
  );
};

const mapNewFiles = async (documentId: string, payload: SaveDocumentInput, ownerId: string) => {
  const uploadedFiles = [...(payload.uploadedFiles ?? [])];
  const nextFiles: StoredFile[] = [];

  for (const rawFile of payload.files ?? []) {
    const file = normalizeStoredFile(rawFile);

    if (file.url || file.path || file.fileId) {
      nextFiles.push(
        sanitizeStoredFile({
          ...file,
          fileId: file.fileId || file.path || file.url,
          path: file.path || file.fileId,
        }),
      );
      continue;
    }

    const upload = uploadedFiles.shift();

    if (!upload) {
      continue;
    }

    nextFiles.push(
      await uploadNewFile({
        documentId,
        file: upload,
        meta: file,
        ownerId,
      }),
    );
  }

  while (uploadedFiles.length > 0) {
    const upload = uploadedFiles.shift();

    if (!upload) {
      continue;
    }

    nextFiles.push(
      await uploadNewFile({
        documentId,
        file: upload,
        meta: sanitizeStoredFile({
          originalName: upload.name,
          mimeType: upload.type || undefined,
          size: upload.size,
        }),
        ownerId,
      }),
    );
  }

  return nextFiles;
};

export const firebaseApi = {
  login: async (username: string, password: string): Promise<{ user: User; token: string }> => {
    ensureFirebaseEnabled();
    const auth = getFirebaseAuth();
    const email = await resolveLoginEmail(username);
    const result = await signInWithEmailAndPassword(auth, email, password);
    const profile =
      (await ensureCurrentUserProfile()) ??
      sanitizeUserRecord(result.user.uid, {
        email: result.user.email || email,
        name: result.user.displayName || email,
        role: 'general',
        username: result.user.email || email,
      });

    return {
      user: profile,
      token: await result.user.getIdToken(),
    };
  },

  verifySession: async (): Promise<User | null> => {
    ensureFirebaseEnabled();
    await waitForInitialAuthState();
    return ensureCurrentUserProfile();
  },

  logout: () => {
    if (!hasFirebaseConfig) {
      return;
    }

    void signOut(getFirebaseAuth());
  },

  register: async (userData: Omit<User, '_id'>): Promise<{ user: User; token: string }> => {
    ensureFirebaseEnabled();

    if (!userData.email && !userData.username) {
      throw new Error('กรุณาระบุอีเมลสำหรับสมัครสมาชิก');
    }

    if (!userData.password) {
      throw new Error('กรุณาระบุรหัสผ่าน');
    }

    const auth = getFirebaseAuth();
    const email = (userData.email || userData.username).trim().toLowerCase();
    const result = await createUserWithEmailAndPassword(auth, email, userData.password);

    await updateProfile(result.user, {
      displayName: userData.name,
      photoURL: userData.avatar || null,
    });

    const profile = await syncUserProfile(result.user.uid, {
      avatar: userData.avatar,
      email,
      name: userData.name,
      phone: userData.phone,
      role: userData.role,
      username: userData.username || email,
    });

    return {
      user: profile,
      token: await result.user.getIdToken(),
    };
  },

  getUsers: async () => {
    ensureFirebaseEnabled();
    const snapshot = await getDocs(collection(getFirebaseDb(), USERS_COLLECTION));

    return snapshot.docs
      .map((docSnapshot) => sanitizeUserRecord(docSnapshot.id, docSnapshot.data()))
      .sort((left, right) => left.name.localeCompare(right.name, 'th'));
  },

  saveUser: async (payload: SaveUserInput, id?: string) => {
    ensureFirebaseEnabled();
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();

    if (!id) {
      const email = (payload.email || payload.username || '').trim().toLowerCase();
      const password = payload.password?.trim();
      const name = payload.name?.trim();

      if (!email || !password || !name) {
        throw new Error('กรุณากรอกชื่อ อีเมล และรหัสผ่านให้ครบ');
      }

      const secondaryApp = createSecondaryFirebaseApp();
      const secondaryAuth = getAuth(secondaryApp);

      try {
        const result = await createUserWithEmailAndPassword(secondaryAuth, email, password);

        await updateProfile(result.user, {
          displayName: name,
          photoURL: payload.avatar || null,
        });

        const record = buildUserRecord({
          avatar: payload.avatar,
          email,
          name,
          phone: payload.phone,
          role: payload.role,
          username: payload.username || email,
        });

        await setDoc(doc(db, USERS_COLLECTION, result.user.uid), record, { merge: true });
        return sanitizeUserRecord(result.user.uid, record);
      } finally {
        await signOut(secondaryAuth).catch(() => undefined);
        await disposeFirebaseApp(secondaryApp).catch(() => undefined);
      }
    }

    const profileRef = doc(db, USERS_COLLECTION, id);
    const snapshot = await getDoc(profileRef);

    if (!snapshot.exists()) {
      throw new Error('ไม่พบข้อมูลผู้ใช้ที่ต้องการแก้ไข');
    }

    const existing = snapshot.data();
    const isCurrentUser = auth.currentUser?.uid === id;
    const nextRecord = {
      ...existing,
      name:
        payload.name !== undefined ? payload.name.trim() : getFieldString(existing.name),
      role:
        payload.role !== undefined ? normalizeRole(payload.role) : normalizeRole(existing.role),
      phone:
        payload.phone !== undefined ? payload.phone.trim() : getFieldString(existing.phone),
      avatar:
        payload.avatar !== undefined ? payload.avatar.trim() : getFieldString(existing.avatar),
      updatedAt: nowIso(),
    };

    if (payload.password?.trim()) {
      if (!isCurrentUser || !auth.currentUser) {
        throw new Error(
          'การเปลี่ยนรหัสผ่านผู้ใช้อื่นบน Firebase ต้องใช้ Admin SDK หรือ Cloud Functions',
        );
      }

      await updatePassword(auth.currentUser, payload.password.trim());
    }

    if (isCurrentUser && auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: nextRecord.name,
        photoURL: nextRecord.avatar || null,
      });
    }

    await setDoc(profileRef, nextRecord, { merge: true });
    return sanitizeUserRecord(id, nextRecord);
  },

  deleteUser: async (id: string) => {
    ensureFirebaseEnabled();
    const auth = getFirebaseAuth();

    if (!auth.currentUser || auth.currentUser.uid !== id) {
      throw new Error(
        'การลบผู้ใช้คนอื่นบน Firebase ต้องใช้ Admin SDK หรือ Cloud Functions',
      );
    }

    await deleteDoc(doc(getFirebaseDb(), USERS_COLLECTION, id));
    await deleteCurrentAuthUser(auth.currentUser);
    return true;
  },

  getDocTypes: async () => {
    ensureFirebaseEnabled();
    return ensureDefaultDocTypes();
  },

  saveDocType: async (payload: SaveDocTypeInput, id?: string) => {
    ensureFirebaseEnabled();
    const db = getFirebaseDb();
    const docId =
      id ||
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `doctype-${Date.now()}`);
    const timestamp = nowIso();
    const nextRecord = {
      name: (payload.name || '').trim(),
      color: (payload.color || '#1e3a8a').trim(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    if (!nextRecord.name) {
      throw new Error('กรุณาระบุชื่อประเภทเอกสาร');
    }

    if (id) {
      const snapshot = await getDoc(doc(db, DOCTYPES_COLLECTION, id));
      const existing = snapshot.exists() ? snapshot.data() : {};
      nextRecord.createdAt = toIsoString(existing.createdAt, timestamp);
    }

    await setDoc(doc(db, DOCTYPES_COLLECTION, docId), nextRecord, { merge: true });
    return sanitizeDocTypeRecord(docId, nextRecord);
  },

  deleteDocType: async (id: string) => {
    ensureFirebaseEnabled();
    await deleteDoc(doc(getFirebaseDb(), DOCTYPES_COLLECTION, id));
    return true;
  },

  getDocuments: async () => {
    ensureFirebaseEnabled();
    const snapshot = await getDocs(collection(getFirebaseDb(), DOCUMENTS_COLLECTION));

    return snapshot.docs
      .map((docSnapshot) => sanitizeDocumentRecord(docSnapshot.id, docSnapshot.data()))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  },

  saveDocument: async (payload: SaveDocumentInput, id?: string) => {
    ensureFirebaseEnabled();
    const db = getFirebaseDb();
    const auth = getFirebaseAuth();
    const documentId =
      id ||
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `document-${Date.now()}`);
    const documentRef = doc(db, DOCUMENTS_COLLECTION, documentId);
    const existingSnapshot = id ? await getDoc(documentRef) : null;
    const existingDocument =
      existingSnapshot?.exists() ? sanitizeDocumentRecord(documentId, existingSnapshot.data()) : null;
    const ownerId = payload.ownerId || existingDocument?.ownerId || auth.currentUser?.uid || '';
    const nextFiles = await mapNewFiles(documentId, payload, ownerId || 'anonymous');
    const indexed = buildDocumentSearchIndex({
      docNo: payload.docNo,
      subject: payload.subject,
      origin: payload.origin,
      resp: payload.resp,
      files: nextFiles,
    });
    const timestamp = nowIso();
    const nextRecord = {
      docNo: (payload.docNo || '').trim(),
      subject: (payload.subject || '').trim(),
      typeId: (payload.typeId || '').trim(),
      fiscalYear: Number(payload.fiscalYear || new Date().getFullYear() + 543),
      date: payload.date || '',
      origin: (payload.origin || '').trim(),
      resp: (payload.resp || '').trim(),
      ownerId,
      files: indexed.files.map((file) => sanitizeStoredFile(file)),
      searchableContent: indexed.searchableContent || '',
      semanticKeywords: indexed.semanticKeywords ?? [],
      contentIndexedAt: indexed.contentIndexedAt || timestamp,
      createdAt: existingDocument?.createdAt || timestamp,
      updatedAt: timestamp,
    };

    if (!nextRecord.subject || !nextRecord.typeId) {
      throw new Error('กรุณากรอกเรื่องและเลือกประเภทเอกสาร');
    }

    await setDoc(documentRef, nextRecord, { merge: true });

    if (existingDocument) {
      const nextFileKeys = new Set(nextRecord.files.map((file) => getStoredFileKey(file)));
      const removedFiles = existingDocument.files.filter(
        (file) => !nextFileKeys.has(getStoredFileKey(file)),
      );
      await deleteStorageFiles(removedFiles);
    }

    return sanitizeDocumentRecord(documentId, nextRecord);
  },

  deleteDocument: async (id: string) => {
    ensureFirebaseEnabled();
    const db = getFirebaseDb();
    const documentRef = doc(db, DOCUMENTS_COLLECTION, id);
    const snapshot = await getDoc(documentRef);

    if (!snapshot.exists()) {
      throw new Error('ไม่พบเอกสารที่ต้องการลบ');
    }

    const documentRecord = sanitizeDocumentRecord(id, snapshot.data());
    await deleteStorageFiles(documentRecord.files);
    await deleteDoc(documentRef);
    return true;
  },
};
