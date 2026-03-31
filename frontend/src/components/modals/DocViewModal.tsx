import {
  Download,
  Edit2,
  Eye,
  FileText,
  Hash,
  Image,
  Paperclip,
  X,
} from 'lucide-react';

import { showToast } from '../../services/toastService';
import type { DocType, DocumentData, StoredFile, User } from '../../types';
import { hasSearchablePdfContent, getStoredFileName } from '../../utils/documentSearch';
import { formatThaiDate } from '../../utils/format';

interface DocViewModalProps {
  currentUser: User;
  doc: DocumentData;
  docTypes: DocType[];
  onClose: () => void;
  onEdit: () => void;
}

const getFilePresentation = (fileName: string) => {
  if (fileName.match(/\.pdf$/i)) {
    return { Icon: FileText, color: 'text-red-500' };
  }

  if (fileName.match(/\.(doc|docx)$/i)) {
    return { Icon: FileText, color: 'text-blue-500' };
  }

  if (fileName.match(/\.(xls|xlsx)$/i)) {
    return { Icon: FileText, color: 'text-green-500' };
  }

  if (fileName.match(/\.(jpg|jpeg|png)$/i)) {
    return { Icon: Image, color: 'text-amber-500' };
  }

  return { Icon: FileText, color: 'text-slate-400' };
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim();
const backendOrigin = apiBaseUrl ? new URL(apiBaseUrl).origin : window.location.origin;

const getFileAccessUrl = (file: StoredFile) => {
  if (!file.url) {
    return null;
  }

  return file.url.startsWith('http') ? file.url : `${backendOrigin}${file.url}`;
};

const getFileDownloadUrl = (file: StoredFile) => {
  const fileUrl = getFileAccessUrl(file);

  if (!fileUrl) {
    return null;
  }

  try {
    const url = new URL(fileUrl, window.location.origin);

    if (url.pathname.includes('/api/documents/files/')) {
      url.searchParams.set('download', '1');
    }

    return url.toString();
  } catch {
    return fileUrl;
  }
};

export default function DocViewModal({
  currentUser,
  doc,
  docTypes,
  onClose,
  onEdit,
}: DocViewModalProps) {
  const docType = docTypes.find((item) => item._id === doc.typeId);
  const canEdit =
    currentUser.role === 'admin' ||
    doc.ownerId === currentUser.username ||
    doc.ownerId === currentUser._id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 transform animate-in zoom-in-95">
        <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white p-8 dark:border-slate-800 dark:from-slate-800 dark:to-slate-900">
          <div
            className="absolute left-0 top-0 h-2 w-full"
            style={{ backgroundColor: docType?.color || '#1e3a8a' }}
          ></div>
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-6">
              <div className="mb-5 flex items-center gap-3">
                <span
                  className="rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm"
                  style={{ backgroundColor: docType?.color || '#94a3b8' }}
                >
                  {docType?.name || '-'}
                </span>
                <span className="font-mono text-sm font-bold text-slate-500 dark:text-slate-400">
                  <Hash className="mr-1 inline h-3.5 w-3.5" />
                  {doc.docNo || '-'}
                </span>
              </div>
              <h3 className="text-3xl font-bold leading-snug text-slate-900 dark:text-white">
                {doc.subject || '-'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  className="rounded-xl border border-slate-200 bg-white p-3 text-slate-400 shadow-sm transition hover:text-blue-900 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:hover:text-amber-500"
                  onClick={onEdit}
                >
                  <Edit2 className="h-5 w-5" />
                </button>
              )}
              <button
                className="rounded-xl border border-slate-200 bg-white p-3 text-slate-400 shadow-sm transition hover:text-red-500 active:scale-95 dark:border-slate-700 dark:bg-slate-800"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto p-8">
          <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                หน่วยงานต้นเรื่อง
              </p>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {doc.origin || '-'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                วันที่ออกเอกสาร
              </p>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {formatThaiDate(doc.date)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                ปีงบประมาณ
              </p>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {doc.fiscalYear || '-'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                ผู้รับผิดชอบ
              </p>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {doc.resp || '-'}
              </p>
            </div>
          </div>

          <div>
            <h4 className="mb-5 flex items-center text-sm font-bold uppercase tracking-wider text-slate-500">
              <Paperclip className="mr-2 h-5 w-5 text-blue-900 dark:text-amber-500" />
              ไฟล์แนบ ({doc.files.length})
            </h4>
            <div className="flex flex-col gap-4">
              {doc.files.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-medium italic text-slate-400 dark:border-slate-700 dark:bg-slate-800/50">
                  ไม่มีไฟล์แนบ
                </div>
              ) : (
                doc.files.map((file: StoredFile, index) => {
                  const fileName = getStoredFileName(file);
                  const { Icon, color } = getFilePresentation(fileName);
                  const isIndexedPdf = hasSearchablePdfContent(file);
                  const fileUrl = getFileAccessUrl(file);
                  const fileDownloadUrl = getFileDownloadUrl(file);

                  return (
                    <div
                      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-400 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-blue-600"
                      key={`${fileName}-${index}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex overflow-hidden">
                            <Icon className={`mr-5 h-8 w-8 shrink-0 ${color}`} />
                            <div className="min-w-0 flex-1">
                              <span className="block truncate font-mono text-base font-bold text-slate-800 dark:text-slate-200">
                                {fileName}
                              </span>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {file.mimeType && (
                                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                    {file.mimeType}
                                  </span>
                                )}
                                {isIndexedPdf && (
                                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                    Semantic Search พร้อมใช้งาน
                                  </span>
                                )}
                              </div>
                              {file.extractedTextPreview && (
                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                  ตัวอย่างข้อความที่สกัดได้: {file.extractedTextPreview}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                          <button
                            className="inline-flex min-w-[108px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-900 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-amber-500"
                            onClick={() => {
                              if (fileUrl) {
                                window.open(fileUrl, '_blank', 'noopener,noreferrer');
                                return;
                              }

                              showToast('จำลองเปิดดูไฟล์', 'info');
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            เปิดดู
                          </button>
                          <button
                            className="inline-flex min-w-[128px] items-center justify-center rounded-xl border border-blue-900 bg-blue-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-950 active:scale-95 dark:border-amber-500 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                            onClick={() => {
                              if (fileDownloadUrl) {
                                const anchor = document.createElement('a');
                                anchor.href = fileDownloadUrl;
                                anchor.download = file.originalName;
                                anchor.target = '_blank';
                                anchor.rel = 'noopener noreferrer';
                                anchor.click();
                                return;
                              }

                              showToast('จำลองดาวน์โหลด', 'info');
                            }}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            ดาวน์โหลด
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
