import type { ChangeEvent, FormEvent } from 'react';
import {
  CloudUpload,
  Edit2,
  FilePlus,
  FileText,
  Image,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';

import { showToast } from '../../services/toastService';
import type { DocType, DocumentData, SaveDocumentInput, StoredFile, User } from '../../types';
import {
  createStoredFileFromUpload,
  getStoredFileName,
  hasSearchablePdfContent,
} from '../../utils/documentSearch';

interface DocFormModalProps {
  currentUser: User;
  doc: Partial<DocumentData>;
  docTypes: DocType[];
  onClose: () => void;
  onSave: (data: SaveDocumentInput, id?: string) => Promise<unknown> | unknown;
}

const getFilePresentation = (fileName: string) => {
  const normalized = fileName.toLowerCase();

  if (normalized.endsWith('.pdf')) {
    return { Icon: FileText, color: 'text-red-500' };
  }

  if (normalized.match(/\.(doc|docx)$/)) {
    return { Icon: FileText, color: 'text-blue-500' };
  }

  if (normalized.match(/\.(xls|xlsx)$/)) {
    return { Icon: FileText, color: 'text-green-500' };
  }

  if (normalized.match(/\.(jpg|jpeg|png)$/)) {
    return { Icon: Image, color: 'text-amber-500' };
  }

  return { Icon: FileText, color: 'text-slate-400' };
};

export default function DocFormModal({
  currentUser,
  doc,
  docTypes,
  onClose,
  onSave,
}: DocFormModalProps) {
  const isEdit = Boolean(doc._id);
  const [isSaving, setIsSaving] = useState(false);
  const [isExtractingFiles, setIsExtractingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUploads, setPendingUploads] = useState<Array<{ clientId: string; file: File }>>([]);
  const [formData, setFormData] = useState({
    docNo: doc.docNo ?? '',
    subject: doc.subject ?? '',
    typeId: doc.typeId ?? '',
    fiscalYear: doc.fiscalYear ?? new Date().getFullYear() + 543,
    date: doc.date ?? '',
    origin: doc.origin ?? '',
    resp: doc.resp ?? '',
  });
  const [files, setFiles] = useState<StoredFile[]>(doc.files ?? []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSaving || isExtractingFiles) {
      return;
    }

    setIsSaving(true);

    try {
      await onSave(
        {
          ...formData,
          files,
          uploadedFiles: files
            .map((file) => {
              if (!file.clientId) {
                return null;
              }

              return (
                pendingUploads.find((pendingUpload) => pendingUpload.clientId === file.clientId)
                  ?.file ?? null
              );
            })
            .filter((file): file is File => Boolean(file)),
          ownerId: doc.ownerId ?? currentUser._id,
        },
        doc._id,
      );
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files ? Array.from(event.target.files) : [];

    if (!selectedFiles.length) {
      event.target.value = '';
      return;
    }

    setIsExtractingFiles(true);
    const failedExtractions: string[] = [];

    try {
      const processedFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          try {
            return await createStoredFileFromUpload(file);
          } catch {
            const clientId =
              typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID()
                : `${file.name}-${file.size}-${file.lastModified}-${Date.now()}`;
            failedExtractions.push(file.name);
            return {
              clientId,
              originalName: file.name,
              mimeType: file.type || undefined,
              size: file.size,
            } satisfies StoredFile;
          }
        }),
      );

      setFiles((current) => [...current, ...processedFiles]);
      setPendingUploads((current) => [
        ...current,
        ...selectedFiles.map((file, index) => ({
          clientId: processedFiles[index].clientId ?? `${file.name}-${file.size}-${index}`,
          file,
        })),
      ]);

      const searchablePdfCount = processedFiles.filter(hasSearchablePdfContent).length;

      if (searchablePdfCount > 0) {
        showToast(
          `สกัดข้อความจาก PDF สำเร็จ ${searchablePdfCount} ไฟล์ พร้อมค้นจากเนื้อหาแล้ว`,
          'info',
        );
      }

      if (failedExtractions.length > 0) {
        showToast(
          `บางไฟล์สกัดข้อความไม่ได้ (${failedExtractions.length}) ระบบจะยังเก็บไฟล์ไว้ให้ค้นจากชื่อไฟล์แทน`,
          'warning',
        );
      }
    } finally {
      setIsExtractingFiles(false);
      event.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 transform animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-6 dark:border-slate-800 dark:bg-slate-800/30">
          <h3 className="flex items-center text-xl font-bold text-slate-900 dark:text-white">
            {isEdit ? (
              <Edit2 className="mr-3 h-6 w-6 text-blue-900 dark:text-amber-500" />
            ) : (
              <FilePlus className="mr-3 h-6 w-6 text-blue-900 dark:text-amber-500" />
            )}
            {isEdit ? 'แก้ไขข้อมูลเอกสาร' : 'เพิ่มเอกสารใหม่'}
          </h3>
          <button
            className="rounded-xl p-2.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500 active:scale-95 dark:hover:bg-red-500/10"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-8">
          <form className="space-y-8" id="doc-form" onSubmit={handleSubmit}>
            <h4 className="border-b border-slate-100 pb-3 text-base font-bold text-slate-800 dark:border-slate-800 dark:text-white">
              ข้อมูลเอกสาร
            </h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-500 dark:text-slate-400">
                  เลขที่หนังสือ
                </label>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 font-mono text-base outline-none transition-all focus:border-blue-900 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-amber-500 dark:focus:bg-slate-900"
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, docNo: event.target.value }))
                  }
                  type="text"
                  value={formData.docNo}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-500 dark:text-slate-400">
                  วันที่ออกเอกสาร
                </label>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-base outline-none transition-all focus:border-blue-900 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-amber-500 dark:focus:bg-slate-900"
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, date: event.target.value }))
                  }
                  type="date"
                  value={formData.date}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-500 dark:text-slate-400">
                  เรื่อง
                </label>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-base outline-none transition-all focus:border-blue-900 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-amber-500 dark:focus:bg-slate-900"
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, subject: event.target.value }))
                  }
                  required
                  type="text"
                  value={formData.subject}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-500 dark:text-slate-400">
                  ประเภทเอกสาร
                </label>
                <select
                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-base outline-none transition-all focus:border-blue-900 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-amber-500 dark:focus:bg-slate-900"
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, typeId: event.target.value }))
                  }
                  required
                  value={formData.typeId}
                >
                  <option value="">-- เลือกหมวดหมู่ --</option>
                  {docTypes.map((docType) => (
                    <option key={docType._id} value={docType._id}>
                      {docType.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-500 dark:text-slate-400">
                  ปีงบประมาณ
                </label>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-base outline-none transition-all focus:border-blue-900 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-amber-500 dark:focus:bg-slate-900"
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      fiscalYear: Number(event.target.value) || current.fiscalYear,
                    }))
                  }
                  type="number"
                  value={formData.fiscalYear}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-500 dark:text-slate-400">
                  หน่วยงานต้นเรื่อง
                </label>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-base outline-none transition-all focus:border-blue-900 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-amber-500 dark:focus:bg-slate-900"
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, origin: event.target.value }))
                  }
                  type="text"
                  value={formData.origin}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-500 dark:text-slate-400">
                  ผู้รับผิดชอบ
                </label>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-base outline-none transition-all focus:border-blue-900 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-amber-500 dark:focus:bg-slate-900"
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, resp: event.target.value }))
                  }
                  type="text"
                  value={formData.resp}
                />
              </div>
            </div>

            <div className="pt-4">
              <div className="mb-5 border-b border-slate-100 pb-3 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                  ไฟล์แนบและ AI Semantic Index
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  เมื่ออัปโหลดไฟล์ PDF ระบบจะสกัดข้อความภายในไฟล์ให้อัตโนมัติ เพื่อนำไปใช้ค้นหาเอกสารจากเนื้อหาได้โดยตรง
                </p>
              </div>

              <div
                className="group cursor-pointer rounded-[2rem] border-2 border-dashed border-slate-300 p-12 text-center transition-all hover:border-blue-900 hover:bg-blue-50/50 dark:border-slate-700 dark:hover:border-amber-500 dark:hover:bg-blue-900/10"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-slate-100 bg-white shadow-sm transition-transform group-hover:scale-110 dark:border-slate-700 dark:bg-slate-800">
                  <CloudUpload className="h-10 w-10 text-slate-400 transition-colors group-hover:text-blue-900 dark:group-hover:text-amber-500" />
                </div>
                <p className="mb-1 text-base font-bold text-slate-700 dark:text-slate-300">
                  คลิกเพื่อเลือกไฟล์แนบ
                </p>
                <p className="text-sm text-slate-500">
                  รองรับ PDF, Word, Excel, รูปภาพ และ PDF จะถูกสกัดข้อความเพื่อใช้ค้นหาเชิงความหมาย
                </p>
                <input
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  className="hidden"
                  multiple
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  type="file"
                />
              </div>

              {isExtractingFiles && (
                <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200">
                  ระบบกำลังสกัดข้อความจากไฟล์ PDF เพื่อสร้าง Semantic Search...
                </div>
              )}

              {files.length > 0 && (
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {files.map((file, index) => {
                    const fileName = getStoredFileName(file);
                    const { Icon, color } = getFilePresentation(fileName);
                    const isIndexedPdf = hasSearchablePdfContent(file);

                    return (
                      <div
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/50"
                        key={`${fileName}-${index}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center overflow-hidden">
                              <Icon className={`mr-3 h-5 w-5 shrink-0 ${color}`} />
                              <span className="truncate font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                                {fileName}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                                {file.mimeType || 'ไฟล์แนบ'}
                              </span>
                              {isIndexedPdf && (
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                  พร้อมค้นจากเนื้อหา PDF
                                </span>
                              )}
                            </div>
                            {file.extractedTextPreview && (
                              <p className="mt-2 truncate text-xs text-slate-500 dark:text-slate-400">
                                ตัวอย่างข้อความ: {file.extractedTextPreview}
                              </p>
                            )}
                          </div>
                          <button
                            className="rounded-lg border border-slate-100 bg-white p-1.5 text-slate-400 shadow-sm transition hover:text-red-500 active:scale-95 dark:border-slate-700 dark:bg-slate-800"
                            onClick={() => {
                              const removedFile = files[index];
                              setFiles((current) =>
                                current.filter((_, currentIndex) => currentIndex !== index),
                              );

                              if (removedFile?.clientId) {
                                setPendingUploads((current) =>
                                  current.filter(
                                    (pendingUpload) => pendingUpload.clientId !== removedFile.clientId,
                                  ),
                                );
                              }
                            }}
                            type="button"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-4 border-t border-slate-100 bg-slate-50/80 px-8 py-6 dark:border-slate-800 dark:bg-slate-800/30">
          <button
            className="rounded-2xl border border-slate-200 bg-white px-8 py-3.5 text-base font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            onClick={onClose}
            type="button"
          >
            ยกเลิก
          </button>
          <button
            className="rounded-2xl border border-blue-800 bg-blue-900 px-10 py-3.5 text-base font-bold text-white shadow-md shadow-blue-900/20 transition hover:bg-blue-950 active:scale-95 disabled:opacity-50"
            disabled={isSaving || isExtractingFiles}
            form="doc-form"
            type="submit"
          >
            {isExtractingFiles
              ? 'กำลังสกัดข้อความจาก PDF...'
              : isSaving
                ? 'กำลังบันทึก...'
                : 'บันทึกข้อมูล'}
          </button>
        </div>
      </div>
    </div>
  );
}
