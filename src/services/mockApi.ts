import type {
  DocType,
  DocumentData,
  SaveDocTypeInput,
  SaveDocumentInput,
  SaveUserInput,
  StoredFile,
  User,
} from '../types';
import { AUTH_TOKEN_KEY, generateToken } from '../utils/auth';
import { buildDocumentSearchIndex, normalizeStoredFile } from '../utils/documentSearch';

const DB_KEY = 'gov_doc_pro_db_v1';
const DEFAULT_DOC_TYPE_COLOR = '#1e3a8a';

interface MockDb {
  users: User[];
  docTypes: DocType[];
  documents: DocumentData[];
}

const defaultDocTypes: DocType[] = [
  { _id: '1', name: 'คำสั่ง', color: '#1e3a8a' },
  { _id: '2', name: 'หนังสือราชการ', color: '#3b82f6' },
  { _id: '3', name: 'บันทึกข้อความ', color: '#16a34a' },
  { _id: '4', name: 'ประกาศ', color: '#f59e0b' },
];

const cloneUser = (user: User): User => ({ ...user });

const sanitizeStoredFileForSave = (file: StoredFile): StoredFile => {
  const normalized = normalizeStoredFile(file);
  return {
    originalName: normalized.originalName,
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

const cloneDocType = (docType: DocType): DocType => ({ ...docType });
const cloneDocument = (document: DocumentData): DocumentData => ({
  ...document,
  files: document.files.map(sanitizeStoredFileForSave),
  semanticKeywords: [...(document.semanticKeywords ?? [])],
});

const normalizeDocTypeRecord = (docType: Partial<DocType>, fallbackIndex = 0): DocType => ({
  _id: docType._id ?? String(fallbackIndex + 1),
  name: docType.name ?? defaultDocTypes[fallbackIndex]?.name ?? '',
  color: docType.color ?? defaultDocTypes[fallbackIndex]?.color ?? DEFAULT_DOC_TYPE_COLOR,
});

const normalizeStoredFiles = (files: Array<StoredFile | string> = []) =>
  files.map((file) => sanitizeStoredFileForSave(normalizeStoredFile(file)));

const toDocumentRecord = (data: SaveDocumentInput, current?: DocumentData): DocumentData => {
  const files = normalizeStoredFiles(data.files ?? current?.files ?? []);
  const indexed = buildDocumentSearchIndex({
    docNo: data.docNo ?? current?.docNo ?? '',
    subject: data.subject ?? current?.subject ?? '',
    origin: data.origin ?? current?.origin ?? '',
    resp: data.resp ?? current?.resp ?? '',
    files,
  });

  return {
    _id: current?._id ?? String(Date.now()),
    docNo: data.docNo ?? current?.docNo ?? '',
    subject: data.subject ?? current?.subject ?? '',
    typeId: String(data.typeId ?? current?.typeId ?? ''),
    fiscalYear: Number(data.fiscalYear ?? current?.fiscalYear ?? new Date().getFullYear() + 543),
    date: data.date ?? current?.date ?? '',
    origin: data.origin ?? current?.origin ?? '',
    resp: data.resp ?? current?.resp ?? '',
    files: indexed.files.map(sanitizeStoredFileForSave),
    ownerId: String(data.ownerId ?? current?.ownerId ?? ''),
    createdAt: current?.createdAt ?? new Date().toISOString(),
    searchableContent: indexed.searchableContent,
    semanticKeywords: indexed.semanticKeywords,
    contentIndexedAt: indexed.contentIndexedAt,
  };
};

const normalizeDocumentRecord = (document: Partial<DocumentData>): DocumentData =>
  toDocumentRecord(
    {
      docNo: document.docNo ?? '',
      subject: document.subject ?? '',
      typeId: document.typeId ?? '',
      fiscalYear: document.fiscalYear ?? new Date().getFullYear() + 543,
      date: document.date ?? '',
      origin: document.origin ?? '',
      resp: document.resp ?? '',
      files: normalizeStoredFiles((document.files as Array<StoredFile | string> | undefined) ?? []),
      ownerId: document.ownerId ?? '',
    },
    document as DocumentData | undefined,
  );

const getInitialDB = (): MockDb => {
  const saved = localStorage.getItem(DB_KEY);

  if (!saved) {
    return {
      users: [],
      docTypes: defaultDocTypes,
      documents: [],
    };
  }

  try {
    const parsed = JSON.parse(saved) as Partial<MockDb>;
    return {
      users: parsed.users ?? [],
      docTypes:
        parsed.docTypes?.length
          ? parsed.docTypes.map((docType, index) => normalizeDocTypeRecord(docType, index))
          : defaultDocTypes,
      documents: (parsed.documents ?? []).map((document) => normalizeDocumentRecord(document)),
    };
  } catch {
    return {
      users: [],
      docTypes: defaultDocTypes,
      documents: [],
    };
  }
};

const MOCK_DB: MockDb = getInitialDB();

const saveDB = () => {
  localStorage.setItem(DB_KEY, JSON.stringify(MOCK_DB));
};

export const mockApi = {
  login: async (username: string, password: string): Promise<{ user: User; token: string }> =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = MOCK_DB.users.find(
          (current) =>
            (current.username === username || current.email === username) &&
            current.password === password,
        );

        if (!user) {
          reject(new Error('Invalid credentials'));
          return;
        }

        const token = generateToken(user);
        sessionStorage.setItem(AUTH_TOKEN_KEY, token);
        resolve({ user: cloneUser(user), token });
      }, 800);
    }),

  verifySession: async (): Promise<User | null> => {
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
      return null;
    }

    try {
      const decoded = JSON.parse(atob(token)) as { id: string; exp: number };

      if (decoded.exp < Date.now()) {
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        return null;
      }

      const user = MOCK_DB.users.find((current) => current._id === String(decoded.id));
      return user ? cloneUser(user) : null;
    } catch {
      return null;
    }
  },

  logout: () => {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  },

  register: async (userData: Omit<User, '_id'>): Promise<{ user: User; token: string }> =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        const exists = MOCK_DB.users.find(
          (current) =>
            current.username === userData.username || current.email === userData.email,
        );

        if (exists) {
          reject(new Error('User exists'));
          return;
        }

        const newUser: User = { ...userData, _id: String(Date.now()) };
        MOCK_DB.users.push(newUser);
        saveDB();

        const token = generateToken(newUser);
        sessionStorage.setItem(AUTH_TOKEN_KEY, token);
        resolve({ user: cloneUser(newUser), token });
      }, 800);
    }),

  getUsers: async () =>
    new Promise<User[]>((resolve) => {
      setTimeout(() => resolve(MOCK_DB.users.map(cloneUser)), 200);
    }),

  saveUser: async (data: SaveUserInput, id?: string) =>
    new Promise<User>((resolve) => {
      setTimeout(() => {
        let savedUser: User;

        if (id) {
          const index = MOCK_DB.users.findIndex((current) => current._id === id);

          if (index > -1) {
            MOCK_DB.users[index] = { ...MOCK_DB.users[index], ...data };
            savedUser = MOCK_DB.users[index];
          } else {
            savedUser = {
              _id: String(Date.now()),
              username: data.username ?? data.email ?? `user_${Date.now()}`,
              name: data.name ?? '',
              role: data.role ?? 'general',
              password: data.password,
              avatar: data.avatar,
              phone: data.phone,
              email: data.email,
            };
            MOCK_DB.users.push(savedUser);
          }
        } else {
          savedUser = {
            _id: String(Date.now()),
            username: data.username ?? data.email ?? `user_${Date.now()}`,
            name: data.name ?? '',
            role: data.role ?? 'general',
            password: data.password,
            avatar: data.avatar,
            phone: data.phone,
            email: data.email,
          };

          MOCK_DB.users.push(savedUser);
        }

        saveDB();
        resolve(cloneUser(savedUser));
      }, 300);
    }),

  deleteUser: async (id: string) =>
    new Promise<boolean>((resolve) => {
      setTimeout(() => {
        MOCK_DB.users = MOCK_DB.users.filter((current) => current._id !== id);
        saveDB();
        resolve(true);
      }, 300);
    }),

  getDocTypes: async () =>
    new Promise<DocType[]>((resolve) => {
      setTimeout(() => resolve(MOCK_DB.docTypes.map(cloneDocType)), 200);
    }),

  saveDocType: async (data: SaveDocTypeInput, id?: string) =>
    new Promise<DocType>((resolve) => {
      setTimeout(() => {
        let savedDocType: DocType;

        if (id) {
          const index = MOCK_DB.docTypes.findIndex((current) => current._id === id);

          if (index > -1) {
            MOCK_DB.docTypes[index] = {
              ...MOCK_DB.docTypes[index],
              ...data,
              color: data.color ?? MOCK_DB.docTypes[index].color ?? DEFAULT_DOC_TYPE_COLOR,
            };
            savedDocType = MOCK_DB.docTypes[index];
          } else {
            savedDocType = {
              _id: String(Date.now()),
              name: data.name ?? '',
              color: data.color ?? DEFAULT_DOC_TYPE_COLOR,
            };
            MOCK_DB.docTypes.push(savedDocType);
          }
        } else {
          savedDocType = {
            _id: String(Date.now()),
            name: data.name ?? '',
            color: data.color ?? DEFAULT_DOC_TYPE_COLOR,
          };

          MOCK_DB.docTypes.push(savedDocType);
        }

        saveDB();
        resolve(cloneDocType(savedDocType));
      }, 300);
    }),

  deleteDocType: async (id: string) =>
    new Promise<boolean>((resolve) => {
      setTimeout(() => {
        MOCK_DB.docTypes = MOCK_DB.docTypes.filter((current) => current._id !== id);
        saveDB();
        resolve(true);
      }, 300);
    }),

  getDocuments: async () =>
    new Promise<DocumentData[]>((resolve) => {
      setTimeout(() => resolve(MOCK_DB.documents.map(cloneDocument)), 200);
    }),

  saveDocument: async (data: SaveDocumentInput, id?: string) =>
    new Promise<DocumentData>((resolve) => {
      setTimeout(() => {
        let savedDocument: DocumentData;

        if (id) {
          const index = MOCK_DB.documents.findIndex((current) => current._id === id);

          if (index > -1) {
            MOCK_DB.documents[index] = toDocumentRecord(data, MOCK_DB.documents[index]);
            savedDocument = MOCK_DB.documents[index];
          } else {
            savedDocument = toDocumentRecord(data);
            MOCK_DB.documents.push(savedDocument);
          }
        } else {
          savedDocument = toDocumentRecord(data);
          MOCK_DB.documents.push(savedDocument);
        }

        saveDB();
        resolve(cloneDocument(savedDocument));
      }, 300);
    }),

  deleteDocument: async (id: string) =>
    new Promise<boolean>((resolve) => {
      setTimeout(() => {
        MOCK_DB.documents = MOCK_DB.documents.filter((current) => current._id !== id);
        saveDB();
        resolve(true);
      }, 300);
    }),
};
