import type { DocType, DocumentData, User } from '../types';

export const previewCurrentUser: User = {
  _id: 'preview-admin',
  username: 'k@gmail.com',
  name: '11111 22222',
  role: 'admin',
  email: 'k@gmail.com',
};

export const previewUsers: User[] = [
  previewCurrentUser,
];

export const previewDocTypes: DocType[] = [
  { _id: 'preview-order', name: 'คำสั่ง', color: '#1e3a8a' },
  { _id: 'preview-official-letter', name: 'หนังสือราชการ', color: '#3b82f6' },
  { _id: 'preview-memo', name: 'บันทึกข้อความ', color: '#16a34a' },
  { _id: 'preview-announcement', name: 'ประกาศ', color: '#f59e0b' },
];

export const previewDocuments: DocumentData[] = [];