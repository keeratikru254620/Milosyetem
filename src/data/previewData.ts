import type { DocType, DocumentData, User } from '../types';

export const previewCurrentUser: User = {
  _id: 'preview-admin',
  username: 'preview.admin@milosystem.local',
  name: 'ผู้ดูแลระบบตัวอย่าง',
  role: 'admin',
  email: 'preview.admin@milosystem.local',
};

export const previewUsers: User[] = [previewCurrentUser];

export const previewDocTypes: DocType[] = [
  { _id: 'preview-order', name: 'คำสั่ง', color: '#1e3a8a' },
  { _id: 'preview-official-letter', name: 'หนังสือราชการ', color: '#3b82f6' },
  { _id: 'preview-memo', name: 'บันทึกข้อความ', color: '#16a34a' },
  { _id: 'preview-announcement', name: 'ประกาศ', color: '#f59e0b' },
];

export const previewDocuments: DocumentData[] = [
  {
    _id: 'preview-doc-1',
    docNo: 'กม 0401/2569',
    subject: 'ตัวอย่างเอกสารสำหรับโหมดพรีวิว',
    typeId: 'preview-order',
    fiscalYear: 2569,
    date: new Date().toISOString().slice(0, 10),
    origin: 'กองอำนวยการระบบ',
    resp: 'เจ้าหน้าที่ตัวอย่าง',
    files: [],
    ownerId: previewCurrentUser._id,
    createdAt: new Date().toISOString(),
    searchableContent: 'ตัวอย่างเอกสารสำหรับทดสอบหน้าจอพรีวิว',
    semanticKeywords: ['เอกสาร', 'พรีวิว', 'ตัวอย่าง'],
    contentIndexedAt: new Date().toISOString(),
  },
];
