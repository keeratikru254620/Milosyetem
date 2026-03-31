import type {
  DocType,
  DocumentData,
  SaveDocTypeInput,
  SaveDocumentInput,
  SaveUserInput,
  StoredFile,
  User,
} from '../types';
import { AUTH_TOKEN_KEY } from '../utils/auth';
import { buildDocumentSearchIndex, normalizeStoredFile } from '../utils/documentSearch';
import { http } from './http';

const normalizeUser = (user: Partial<User> & { id?: string }): User => ({
  _id: String(user._id ?? user.id ?? ''),
  username: user.username ?? user.email ?? '',
  password: user.password,
  name: user.name ?? '',
  role: user.role ?? 'general',
  avatar: user.avatar,
  phone: user.phone,
  email: user.email,
});

const normalizeDocType = (docType: Partial<DocType> & { id?: string }): DocType => ({
  _id: String(docType._id ?? docType.id ?? ''),
  name: docType.name ?? '',
  color: docType.color ?? '#1e3a8a',
});

const sanitizeStoredFileForServer = (file: StoredFile): StoredFile => {
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

const normalizeDocument = (
  document: Partial<DocumentData> & {
    id?: string;
    owner?: { _id?: string; id?: string };
    type?: { _id?: string; id?: string };
  },
): DocumentData => {
  const files = (document.files ?? []).map((file) => sanitizeStoredFileForServer(normalizeStoredFile(file)));
  const indexed =
    document.searchableContent && document.semanticKeywords?.length
      ? null
      : buildDocumentSearchIndex({
          docNo: document.docNo ?? '',
          subject: document.subject ?? '',
          origin: document.origin ?? '',
          resp: document.resp ?? '',
          files,
        });

  return {
    _id: String(document._id ?? document.id ?? ''),
    docNo: document.docNo ?? '',
    subject: document.subject ?? '',
    typeId: String(document.typeId ?? document.type?._id ?? document.type?.id ?? ''),
    fiscalYear: Number(document.fiscalYear ?? new Date().getFullYear() + 543),
    date: document.date ?? '',
    origin: document.origin ?? '',
    resp: document.resp ?? '',
    files,
    ownerId: String(document.ownerId ?? document.owner?._id ?? document.owner?.id ?? ''),
    createdAt: document.createdAt ?? new Date().toISOString(),
    searchableContent: document.searchableContent ?? indexed?.searchableContent,
    semanticKeywords: document.semanticKeywords ?? indexed?.semanticKeywords ?? [],
    contentIndexedAt: document.contentIndexedAt ?? indexed?.contentIndexedAt,
  };
};

const setSessionToken = (token?: string | null) => {
  if (token) {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    return;
  }

  sessionStorage.removeItem(AUTH_TOKEN_KEY);
};

const appendFormField = (formData: FormData, key: string, value?: string | number | null) => {
  if (value === undefined || value === null || value === '') {
    return;
  }

  formData.append(key, String(value));
};

export const serverApi = {
  login: async (username: string, password: string): Promise<{ user: User; token: string }> => {
    const { data } = await http.post('/auth/login', { username, password });
    setSessionToken(data.token);
    return {
      user: normalizeUser(data.user),
      token: data.token,
    };
  },

  verifySession: async (): Promise<User | null> => {
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
      return null;
    }

    try {
      const { data } = await http.get('/auth/me');
      return normalizeUser(data.user);
    } catch {
      setSessionToken(null);
      return null;
    }
  },

  logout: () => {
    setSessionToken(null);
  },

  register: async (userData: Omit<User, '_id'>): Promise<{ user: User; token: string }> => {
    const { data } = await http.post('/auth/register', userData);
    setSessionToken(data.token);
    return {
      user: normalizeUser(data.user),
      token: data.token,
    };
  },

  getUsers: async () => {
    const { data } = await http.get('/users');
    return (data as Array<Partial<User> & { id?: string }>).map(normalizeUser);
  },

  saveUser: async (payload: SaveUserInput, id?: string) => {
    const response = id ? await http.put(`/users/${id}`, payload) : await http.post('/users', payload);
    return normalizeUser(response.data);
  },

  deleteUser: async (id: string) => {
    await http.delete(`/users/${id}`);
    return true;
  },

  getDocTypes: async () => {
    const { data } = await http.get('/doc-types');
    return (data as Array<Partial<DocType> & { id?: string }>).map(normalizeDocType);
  },

  saveDocType: async (payload: SaveDocTypeInput, id?: string) => {
    const response = id
      ? await http.put(`/doc-types/${id}`, payload)
      : await http.post('/doc-types', payload);
    return normalizeDocType(response.data);
  },

  deleteDocType: async (id: string) => {
    await http.delete(`/doc-types/${id}`);
    return true;
  },

  getDocuments: async () => {
    const { data } = await http.get('/documents');
    return (data as Array<Partial<DocumentData> & { id?: string }>).map(normalizeDocument);
  },

  saveDocument: async (payload: SaveDocumentInput, id?: string) => {
    const files = (payload.files ?? []).map((file) => sanitizeStoredFileForServer(normalizeStoredFile(file)));
    const indexed = buildDocumentSearchIndex({
      docNo: payload.docNo ?? '',
      subject: payload.subject ?? '',
      origin: payload.origin ?? '',
      resp: payload.resp ?? '',
      files,
    });
    const formData = new FormData();

    appendFormField(formData, 'docNo', payload.docNo);
    appendFormField(formData, 'subject', payload.subject);
    appendFormField(formData, 'typeId', payload.typeId);
    appendFormField(formData, 'fiscalYear', payload.fiscalYear);
    appendFormField(formData, 'date', payload.date);
    appendFormField(formData, 'origin', payload.origin);
    appendFormField(formData, 'resp', payload.resp);
    appendFormField(formData, 'ownerId', payload.ownerId);
    appendFormField(formData, 'searchableContent', indexed.searchableContent);
    appendFormField(formData, 'contentIndexedAt', indexed.contentIndexedAt);
    formData.append('semanticKeywords', JSON.stringify(indexed.semanticKeywords ?? []));
    formData.append('filesMeta', JSON.stringify(files));

    (payload.uploadedFiles ?? []).forEach((file) => {
      formData.append('files', file);
    });

    const response = id
      ? await http.put(`/documents/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      : await http.post('/documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

    return normalizeDocument(response.data);
  },

  deleteDocument: async (id: string) => {
    await http.delete(`/documents/${id}`);
    return true;
  },
};
