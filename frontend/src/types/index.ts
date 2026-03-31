export type UserRole = 'admin' | 'officer' | 'general';

export interface User {
  _id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  email?: string;
}

export interface DocType {
  _id: string;
  name: string;
  color: string;
}

export interface StoredFile {
  clientId?: string;
  originalName: string;
  fileId?: string;
  storedName?: string;
  path?: string;
  url?: string;
  mimeType?: string;
  size?: number;
  extractedText?: string;
  extractedTextPreview?: string;
  extractedAt?: string;
  semanticKeywords?: string[];
}

export interface DocumentData {
  _id: string;
  docNo: string;
  subject: string;
  typeId: string;
  fiscalYear: number;
  date: string;
  origin: string;
  resp: string;
  files: StoredFile[];
  ownerId: string;
  createdAt: string;
  searchableContent?: string;
  semanticKeywords?: string[];
  contentIndexedAt?: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastPayload {
  message: string;
  type: ToastType;
}

export interface ConfirmState {
  title: string;
  message: string;
  resolve: (value: boolean) => void;
}

export type AuthMode = 'login' | 'register' | 'forgot';

export type SaveUserInput = Partial<Omit<User, '_id'>>;
export type SaveDocTypeInput = Partial<Omit<DocType, '_id'>>;

export interface SaveDocumentInput
  extends Partial<Omit<DocumentData, '_id' | 'createdAt' | 'files'>> {
  files?: StoredFile[];
  uploadedFiles?: File[];
}
