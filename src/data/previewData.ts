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
    _id: 'preview-doc-legal-20260505',
    docNo: 'กม 0505/2569',
    subject: 'เอกสารงานกฎหมาย (ไฟล์แนบ)',
    typeId: 'preview-official-letter',
    fiscalYear: 2569,
    date: '2026-05-05',
    origin: 'งานกฎหมาย',
    resp: 'เจ้าหน้าที่งานกฎหมาย',
    files: [
      {
        originalName: 'งานกฎหมาย.rar',
        storedName: 'งานกฎหมาย.rar',
        mimeType: 'application/vnd.rar',
        size: 642245897,
      },
    ],
    ownerId: previewCurrentUser._id,
    createdAt: '2026-05-05T20:18:00+07:00',
    searchableContent: 'งานกฎหมาย เอกสารล่าสุด ไฟล์แนบ',
    semanticKeywords: ['งานกฎหมาย', 'เอกสารล่าสุด', 'ไฟล์แนบ'],
    contentIndexedAt: '2026-05-05T20:18:00+07:00',
  },
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
