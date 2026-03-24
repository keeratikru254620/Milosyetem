import type { DocType, DocumentData, User } from '../types';

export const previewCurrentUser: User = {
  _id: 'preview-admin',
  username: 'admin.preview',
  name: 'Admin Preview',
  role: 'admin',
  email: 'admin.preview@ccib.local',
};

export const previewUsers: User[] = [
  previewCurrentUser,
  {
    _id: 'preview-officer',
    username: 'officer.preview',
    name: 'Officer Preview',
    role: 'officer',
    email: 'officer.preview@ccib.local',
  },
  {
    _id: 'preview-general',
    username: 'general.preview',
    name: 'General Preview',
    role: 'general',
    email: 'general.preview@ccib.local',
  },
];

export const previewDocTypes: DocType[] = [
  { _id: 'preview-order', name: 'คำสั่ง', color: '#1e3a8a' },
  { _id: 'preview-official-letter', name: 'หนังสือราชการ', color: '#2563eb' },
  { _id: 'preview-memo', name: 'บันทึกข้อความ', color: '#16a34a' },
  { _id: 'preview-announcement', name: 'ประกาศ', color: '#f59e0b' },
];

export const previewDocuments: DocumentData[] = [
  {
    _id: 'preview-doc-001',
    docNo: 'CCIB-001/2569',
    subject: 'สรุปผลการติดตามคดีอาชญากรรมทางเทคโนโลยี',
    typeId: 'preview-official-letter',
    fiscalYear: 2569,
    date: '2026-03-18',
    origin: 'บก.สอท.1',
    resp: 'Admin Preview',
    files: [
      {
        originalName: 'cybercrime-report.pdf',
        extractedTextPreview: 'Cyber crime case summary and investigation notes.',
        extractedAt: '2026-03-18T08:45:00.000Z',
        semanticKeywords: ['cybercrime', 'investigation', 'report'],
      },
    ],
    ownerId: 'preview-admin',
    createdAt: '2026-03-18T08:30:00.000Z',
    searchableContent: 'Cyber crime case summary and investigation notes for AI preview search.',
    semanticKeywords: ['cybercrime', 'investigation', 'summary'],
    contentIndexedAt: '2026-03-18T08:45:00.000Z',
  },
  {
    _id: 'preview-doc-002',
    docNo: 'CCIB-014/2569',
    subject: 'แผนงานอบรมความปลอดภัยไซเบอร์ประจำไตรมาส',
    typeId: 'preview-memo',
    fiscalYear: 2569,
    date: '2026-03-10',
    origin: 'ศูนย์อำนวยการ',
    resp: 'Officer Preview',
    files: [
      {
        originalName: 'training-plan.pdf',
        extractedTextPreview: 'Quarterly cyber security training plan for internal officers.',
        extractedAt: '2026-03-10T09:20:00.000Z',
        semanticKeywords: ['training', 'security', 'quarterly'],
      },
    ],
    ownerId: 'preview-officer',
    createdAt: '2026-03-10T09:15:00.000Z',
    searchableContent: 'Quarterly cyber security training plan for internal officers and staff.',
    semanticKeywords: ['training', 'security', 'plan'],
    contentIndexedAt: '2026-03-10T09:20:00.000Z',
  },
  {
    _id: 'preview-doc-003',
    docNo: 'CCIB-027/2569',
    subject: 'ประกาศแนวทางการรับแจ้งเหตุออนไลน์',
    typeId: 'preview-announcement',
    fiscalYear: 2569,
    date: '2026-02-27',
    origin: 'ฝ่ายอำนวยการ',
    resp: 'General Preview',
    files: [
      {
        originalName: 'online-notice.pdf',
        extractedTextPreview: 'Public notice for online incident reporting workflow.',
        extractedAt: '2026-02-27T13:00:00.000Z',
        semanticKeywords: ['notice', 'online', 'workflow'],
      },
    ],
    ownerId: 'preview-general',
    createdAt: '2026-02-27T12:50:00.000Z',
    searchableContent: 'Public notice for online incident reporting workflow and document intake.',
    semanticKeywords: ['notice', 'online', 'incident'],
    contentIndexedAt: '2026-02-27T13:00:00.000Z',
  },
];