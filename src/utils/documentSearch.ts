import type { DocumentData, StoredFile } from '../types';
import { extractTextFromPdf } from './pdfText';

const MAX_EXTRACTED_TEXT_LENGTH = 24000;
const MAX_PREVIEW_LENGTH = 240;
const MAX_SEARCHABLE_CONTENT_LENGTH = 32000;
const MAX_SEMANTIC_KEYWORDS = 18;

const STOP_WORDS = new Set([
  'และ',
  'หรือ',
  'ของ',
  'ที่',
  'ใน',
  'ให้',
  'โดย',
  'จาก',
  'เพื่อ',
  'ตาม',
  'เรื่อง',
  'เรียน',
  'หนังสือ',
  'เอกสาร',
  'ฉบับ',
  'ด้วย',
  'การ',
  'งาน',
  'ระบบ',
  'this',
  'that',
  'with',
  'from',
  'have',
  'your',
  'into',
  'about',
  'subject',
  'document',
]);

const SEMANTIC_GROUPS = [
  ['คำสั่ง', 'สั่งการ', 'แต่งตั้ง', 'มอบหมาย', 'อนุมัติ'],
  ['ประชุม', 'เชิญประชุม', 'วาระ', 'มติ', 'บันทึกการประชุม'],
  ['งบประมาณ', 'งบ', 'การเงิน', 'เบิกจ่าย', 'จัดสรร'],
  ['พัสดุ', 'จัดซื้อ', 'จัดจ้าง', 'ครุภัณฑ์', 'สัญญา'],
  ['รายงาน', 'สรุป', 'ผลการดำเนินงาน', 'ติดตาม', 'ประเมิน'],
  ['โครงการ', 'กิจกรรม', 'อบรม', 'สัมมนา', 'เข้าร่วม'],
  ['ประกาศ', 'ประชาสัมพันธ์', 'แจ้งเวียน', 'หนังสือราชการ'],
];

type SegmentLike = { segment: string; isWordLike?: boolean };
type SegmenterLike = { segment: (value: string) => Iterable<SegmentLike> };

const thaiSegmenter: SegmenterLike | null =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new (Intl as typeof Intl & {
        Segmenter: new (
          locale: string,
          options: { granularity: 'word' },
        ) => SegmenterLike;
      }).Segmenter('th', { granularity: 'word' })
    : null;

export const normalizeSearchText = (value?: string) =>
  (value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const tokenizeSearchText = (value?: string) => {
  const normalized = normalizeSearchText(value).replace(/[^a-z0-9ก-๙\s]/gi, ' ');

  if (!normalized) {
    return [];
  }

  const tokens = thaiSegmenter
    ? Array.from(thaiSegmenter.segment(normalized))
        .filter((segment) => segment.isWordLike)
        .map((segment) => segment.segment)
    : normalized.split(/\s+/);

  return tokens
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token));
};

const expandSemanticTokens = (tokens: string[]) => {
  const expanded = new Set(tokens);

  SEMANTIC_GROUPS.forEach((group) => {
    const matched = group.some(
      (term) =>
        tokens.some((token) => token.includes(term) || term.includes(token)) ||
        expanded.has(term),
    );

    if (matched) {
      group.forEach((term) => expanded.add(term));
    }
  });

  return [...expanded];
};

const takePreview = (value?: string) => {
  const normalized = (value ?? '').replace(/\s+/g, ' ').trim();
  return normalized.slice(0, MAX_PREVIEW_LENGTH);
};

const deriveSemanticKeywords = (value: string, limit = MAX_SEMANTIC_KEYWORDS) => {
  const frequency = new Map<string, number>();

  tokenizeSearchText(value).forEach((token) => {
    frequency.set(token, (frequency.get(token) ?? 0) + 1);
  });

  return [...frequency.entries()]
    .sort((left, right) => right[1] - left[1] || right[0].length - left[0].length)
    .slice(0, limit)
    .map(([token]) => token);
};

export const getStoredFileName = (file?: Partial<StoredFile> | string | null) => {
  if (!file) {
    return '';
  }

  return typeof file === 'string' ? file : file.originalName ?? '';
};

export const normalizeStoredFile = (file: StoredFile | string): StoredFile => {
  const originalName = getStoredFileName(file);

  if (typeof file === 'string') {
    return {
      originalName,
      semanticKeywords: deriveSemanticKeywords(originalName, 6),
    };
  }

  const extractedText = (file.extractedText ?? '').slice(0, MAX_EXTRACTED_TEXT_LENGTH).trim();
  const semanticKeywords =
    file.semanticKeywords?.filter(Boolean) ??
    deriveSemanticKeywords(`${originalName} ${extractedText}`, extractedText ? 12 : 6);

  return {
    clientId: file.clientId,
    originalName,
    storedName: file.storedName,
    path: file.path,
    url: file.url,
    mimeType: file.mimeType,
    size: file.size,
    extractedText: extractedText || undefined,
    extractedTextPreview: file.extractedTextPreview ?? takePreview(extractedText),
    extractedAt: file.extractedAt,
    semanticKeywords,
  };
};

export async function createStoredFileFromUpload(file: File): Promise<StoredFile> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  let extractedText = '';
  const clientId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${file.name}-${file.size}-${file.lastModified}-${Date.now()}`;

  if (isPdf) {
    extractedText = await extractTextFromPdf(file);
  }

  const semanticKeywords = deriveSemanticKeywords(
    `${file.name} ${extractedText}`,
    extractedText ? 12 : 6,
  );

  return {
    clientId,
    originalName: file.name,
    mimeType: file.type || undefined,
    size: file.size,
    extractedText: extractedText || undefined,
    extractedTextPreview: takePreview(extractedText),
    extractedAt: extractedText ? new Date().toISOString() : undefined,
    semanticKeywords,
  };
}

export const buildDocumentSearchIndex = (input: {
  docNo?: string;
  subject?: string;
  origin?: string;
  resp?: string;
  files?: StoredFile[];
}) => {
  const files = (input.files ?? []).map(normalizeStoredFile);
  const searchableContent = normalizeSearchText(
    [
      input.docNo,
      input.subject,
      input.origin,
      input.resp,
      ...files.map((file) => file.originalName),
      ...files.map((file) => file.extractedText ?? ''),
      ...files.flatMap((file) => file.semanticKeywords ?? []),
    ]
      .filter(Boolean)
      .join(' '),
  ).slice(0, MAX_SEARCHABLE_CONTENT_LENGTH);

  const semanticKeywords = deriveSemanticKeywords(
    [
      input.subject,
      input.origin,
      input.resp,
      ...files.map((file) => file.originalName),
      ...files.map((file) => file.extractedTextPreview ?? ''),
      ...files.flatMap((file) => file.semanticKeywords ?? []),
    ]
      .filter(Boolean)
      .join(' '),
    24,
  );

  return {
    files,
    searchableContent: searchableContent || undefined,
    semanticKeywords,
    contentIndexedAt: new Date().toISOString(),
  };
};

export const getDocumentSemanticScore = (document: DocumentData, query: string) => {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return 0;
  }

  const semanticTokens = expandSemanticTokens(tokenizeSearchText(query));
  const searchableContent = normalizeSearchText(
    [
      document.docNo,
      document.subject,
      document.origin,
      document.resp,
      document.searchableContent,
      document.semanticKeywords?.join(' '),
    ]
      .filter(Boolean)
      .join(' '),
  );

  let score = 0;

  if (normalizeSearchText(document.docNo).includes(normalizedQuery)) {
    score += 120;
  }

  if (normalizeSearchText(document.subject).includes(normalizedQuery)) {
    score += 100;
  }

  if (
    normalizeSearchText(document.origin).includes(normalizedQuery) ||
    normalizeSearchText(document.resp).includes(normalizedQuery)
  ) {
    score += 40;
  }

  if (normalizeSearchText(document.searchableContent).includes(normalizedQuery)) {
    score += 70;
  }

  const keywordSet = new Set((document.semanticKeywords ?? []).map(normalizeSearchText));

  semanticTokens.forEach((token) => {
    if (!token) {
      return;
    }

    if (searchableContent.includes(token)) {
      score += keywordSet.has(token) ? 18 : 9;
    }
  });

  if (
    document.files.some((file) => normalizeSearchText(file.originalName).includes(normalizedQuery))
  ) {
    score += 16;
  }

  return score;
};

export const hasSearchablePdfContent = (file?: StoredFile | null) =>
  Boolean(file?.extractedText?.trim());
