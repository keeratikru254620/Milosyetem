import { previewDocTypes, previewDocuments } from '../app/previewData';
import type {
  DocType,
  DocumentData,
  SaveDocTypeInput,
  SaveDocumentInput,
  StoredFile,
} from '../types';
import { buildDocumentSearchIndex, normalizeStoredFile } from '../utils/documentSearch';

const DOC_TYPES_KEY = 'milosystem:docTypes';
const DOCUMENTS_KEY = 'milosystem:documents';
const LOCAL_DB_NAME = 'milosystem-local-db';
const LOCAL_DB_VERSION = 1;
const LOCAL_DB_STORE = 'app-data';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

let localDbPromise: Promise<IDBDatabase | null> | null = null;

const hasWindow = () => typeof window !== 'undefined';

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
  const hasLegacyValue =
    hasWindow() && window.localStorage.getItem(key) !== null;

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

const getDocTypes = () => getPersistedItem<DocType[]>(DOC_TYPES_KEY, previewDocTypes);
const getDocuments = () =>
  getPersistedItem<DocumentData[]>(DOCUMENTS_KEY, previewDocuments);

const saveDocTypes = (docTypes: DocType[]) => setPersistedItem(DOC_TYPES_KEY, docTypes);
const saveDocuments = (documents: DocumentData[]) => setPersistedItem(DOCUMENTS_KEY, documents);

const createId = (prefix: string) =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

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

export const localDataApi = {
  getDocTypes: async () =>
    [...(await getDocTypes())].sort((left, right) => left.name.localeCompare(right.name, 'th')),

  saveDocType: async (payload: SaveDocTypeInput, id?: string) => {
    const docTypes = await getDocTypes();
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

    await saveDocTypes(nextDocTypes);
    return nextDocType;
  },

  deleteDocType: async (id: string) => {
    const documents = await getDocuments();

    if (documents.some((document) => document.typeId === id)) {
      throw new Error('ไม่สามารถลบประเภทเอกสารที่ถูกใช้งานอยู่ได้');
    }

    await saveDocTypes((await getDocTypes()).filter((docType) => docType._id !== id));
    return true;
  },

  getDocuments: async () =>
    [...(await getDocuments())].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),

  saveDocument: async (payload: SaveDocumentInput, id?: string) => {
    const documents = await getDocuments();
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

    await saveDocuments(nextDocuments);
    return nextDocument;
  },

  deleteDocument: async (id: string) => {
    await saveDocuments((await getDocuments()).filter((document) => document._id !== id));
    return true;
  },
};
