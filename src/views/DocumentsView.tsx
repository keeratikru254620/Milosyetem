import {
  ArrowUpDown,
  Building2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  FileText,
  Plus,
  Search,
  SearchX,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import DocFormModal from '../components/modals/DocFormModal';
import DocViewModal from '../components/modals/DocViewModal';
import { confirmDialog } from '../services/confirmService';
import { showToast } from '../services/toastService';
import type { DocType, DocumentData, SaveDocumentInput, User } from '../types';
import {
  getDocumentSemanticScore,
  getStoredFileName,
  normalizeSearchText,
} from '../utils/documentSearch';
import { formatThaiDate } from '../utils/format';

type SortColumn = 'createdAt' | 'date' | 'docNo' | 'fiscalYear' | 'subject' | 'typeId';
type SearchMode = 'normal' | 'semantic';

interface DocumentsViewProps {
  currentUser: User;
  documents: DocumentData[];
  docTypes: DocType[];
  onDeleteDocument: (id: string) => Promise<unknown> | unknown;
  onSaveDocument: (data: SaveDocumentInput, id?: string) => Promise<unknown> | unknown;
}

export default function DocumentsView({
  currentUser,
  documents,
  docTypes,
  onDeleteDocument,
  onSaveDocument,
}: DocumentsViewProps) {
  const [searchMode, setSearchMode] = useState<SearchMode>('normal');
  const [search, setSearch] = useState('');
  const [semanticSearch, setSemanticSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState<{ col: SortColumn; dir: 'asc' | 'desc' }>({
    col: 'createdAt',
    dir: 'desc',
  });
  const [editingDoc, setEditingDoc] = useState<Partial<DocumentData> | null>(null);
  const [viewingDoc, setViewingDoc] = useState<DocumentData | null>(null);

  const years = useMemo(
    () =>
      [...new Set(documents.map((document) => document.fiscalYear).filter(Boolean))].sort(
        (left, right) => right - left,
      ),
    [documents],
  );

  const compareBySort = (left: DocumentData, right: DocumentData) => {
    const leftValue = left[sort.col];
    const rightValue = right[sort.col];

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return sort.dir === 'asc' ? leftValue - rightValue : rightValue - leftValue;
    }

    const result = String(leftValue ?? '').localeCompare(String(rightValue ?? ''), 'th');
    return sort.dir === 'asc' ? result : -result;
  };

  const isSemanticMode = searchMode === 'semantic';
  const activeSemanticQuery = isSemanticMode ? semanticSearch.trim() : '';
  const activeNormalQuery = searchMode === 'normal' ? search : '';

  const semanticScores = useMemo(() => {
    if (!activeSemanticQuery) {
      return new Map<string, number>();
    }

    return new Map(
      documents.map((document) => [
        document._id,
        getDocumentSemanticScore(document, activeSemanticQuery),
      ]),
    );
  }, [activeSemanticQuery, documents]);

  const filteredDocs = useMemo(() => {
    const normalizedSearch = normalizeSearchText(activeNormalQuery);

    const filtered = documents.filter((document) => {
      const metadataBlob = normalizeSearchText(
        [
          document.docNo,
          document.subject,
          document.origin,
          document.resp,
          ...document.files.map((file) => getStoredFileName(file)),
        ]
          .filter(Boolean)
          .join(' '),
      );

      const matchSearch = !normalizedSearch || metadataBlob.includes(normalizedSearch);
      const matchType = !filterType || document.typeId === filterType;
      const matchYear = !filterYear || String(document.fiscalYear) === filterYear;

      return matchSearch && matchType && matchYear;
    });

    if (!activeSemanticQuery) {
      return [...filtered].sort(compareBySort);
    }

    return filtered
      .map((document) => ({
        document,
        score: semanticScores.get(document._id) ?? 0,
      }))
      .filter((item) => item.score > 0)
      .sort(
        (left, right) => right.score - left.score || compareBySort(left.document, right.document),
      )
      .map((item) => item.document);
  }, [
    activeNormalQuery,
    activeSemanticQuery,
    documents,
    filterType,
    filterYear,
    semanticScores,
    sort,
  ]);

  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredDocs.length / itemsPerPage));
  const paginatedDocuments = filteredDocs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSort = (column: SortColumn) => {
    setSort((current) => ({
      col: column,
      dir: current.col === column && current.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleSave = async (data: SaveDocumentInput, id?: string) => {
    try {
      await onSaveDocument(data, id);
      showToast('บันทึกข้อมูลเอกสารสำเร็จ');
    } catch {
      showToast('บันทึกข้อมูลไม่สำเร็จ', 'error');
      throw new Error('Unable to save document');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog(
      'ลบเอกสาร',
      'เอกสารนี้จะถูกลบอย่างถาวร ยืนยันหรือไม่?',
    );

    if (!confirmed) {
      return;
    }

    await onDeleteDocument(id);
    showToast('ลบเอกสารสำเร็จ');
  };

  const hasSemanticQuery = activeSemanticQuery.length > 0;

  return (
    <div className="flex h-full flex-col animate-slide-blur">
      <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="shrink-0 border-b border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                  <button
                    className={`inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                      searchMode === 'normal'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                    }`}
                    onClick={() => {
                      setSearchMode('normal');
                      setCurrentPage(1);
                    }}
                    type="button"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    ค้นหาปกติ
                  </button>
                  <button
                    className={`inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                      searchMode === 'semantic'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                    }`}
                    onClick={() => {
                      setSearchMode('semantic');
                      setCurrentPage(1);
                    }}
                    type="button"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    AI Search
                  </button>
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isSemanticMode
                    ? 'AI Search จะค้นจากข้อความที่ระบบสกัดจากไฟล์ PDF และจัดอันดับผลลัพธ์ตามความเกี่ยวข้องของเนื้อหา'
                    : 'ค้นหาจากข้อมูลเอกสารทั่วไป เช่น เลขที่หนังสือ เรื่อง หน่วยงาน และชื่อไฟล์แนบ'}
                </p>
              </div>

              <button
                className="flex w-full shrink-0 items-center justify-center rounded-2xl border border-blue-800 bg-blue-900 px-8 py-3 text-base font-bold text-white shadow-md shadow-blue-900/20 transition-all hover:bg-blue-950 active:scale-95 xl:w-auto"
                onClick={() => setEditingDoc({})}
              >
                <Plus className="mr-2 h-5 w-5 text-amber-400" /> เพิ่มเอกสารใหม่
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_220px_160px]">
              <div className="group relative">
                {isSemanticMode ? (
                  <FileText className="absolute left-5 top-3.5 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-900 dark:group-focus-within:text-amber-500" />
                ) : (
                  <Search className="absolute left-5 top-3.5 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-900 dark:group-focus-within:text-amber-500" />
                )}
                <input
                  className={`w-full rounded-2xl py-3 pl-12 pr-4 text-base font-bold shadow-sm outline-none transition-all ${
                    isSemanticMode
                      ? 'border border-blue-200 bg-blue-50/70 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 dark:border-blue-900/40 dark:bg-slate-950 dark:text-white dark:focus:border-amber-500 dark:focus:ring-amber-500/20'
                      : 'border border-slate-200 bg-white focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-amber-500 dark:focus:ring-amber-500/20'
                  }`}
                  onChange={(event) => {
                    if (isSemanticMode) {
                      setSemanticSearch(event.target.value);
                    } else {
                      setSearch(event.target.value);
                    }
                    setCurrentPage(1);
                  }}
                  placeholder={
                    isSemanticMode
                      ? 'AI Search: ค้นจากเนื้อหา PDF ภายในไฟล์...'
                      : 'ค้นหาทั่วไป: เลขที่, เรื่อง, หน่วยงาน, ชื่อไฟล์...'
                  }
                  type="text"
                  value={isSemanticMode ? semanticSearch : search}
                />
              </div>

              <select
                className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold shadow-sm outline-none transition hover:border-slate-300 focus:border-blue-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:border-slate-600 dark:focus:border-amber-500"
                onChange={(event) => {
                  setFilterType(event.target.value);
                  setCurrentPage(1);
                }}
                value={filterType}
              >
                <option value="">ทุกประเภท</option>
                {docTypes.map((docType) => (
                  <option key={docType._id} value={docType._id}>
                    {docType.name}
                  </option>
                ))}
              </select>

              <select
                className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold shadow-sm outline-none transition hover:border-slate-300 focus:border-blue-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:border-slate-600 dark:focus:border-amber-500"
                onChange={(event) => {
                  setFilterYear(event.target.value);
                  setCurrentPage(1);
                }}
                value={filterYear}
              >
                <option value="">ทุกปีงบฯ</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {hasSemanticQuery && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                  พบ {filteredDocs.length} เอกสารจากการค้นหาในเนื้อหาไฟล์
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="relative flex-1 overflow-auto">
          <table className="w-full min-w-[980px] border-collapse whitespace-nowrap text-left">
            <thead className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
              <tr className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {[
                  ['docNo', 'เลขที่หนังสือ'],
                  ['subject', 'เรื่อง'],
                  ['typeId', 'ประเภท'],
                  ['fiscalYear', 'ปีงบฯ'],
                  ['date', 'วันที่'],
                ].map(([column, label]) => (
                  <th
                    className="group cursor-pointer px-6 py-5 transition hover:text-blue-900 dark:hover:text-amber-500"
                    key={column}
                    onClick={() => handleSort(column as SortColumn)}
                  >
                    {label}
                    <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 opacity-0 group-hover:opacity-100" />
                  </th>
                ))}
                <th className="px-6 py-5 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-base text-slate-700 dark:divide-slate-800 dark:text-slate-300">
              {paginatedDocuments.length === 0 ? (
                <tr>
                  <td className="py-32 text-center" colSpan={6}>
                    <div className="flex flex-col items-center text-slate-400">
                      <SearchX className="mb-5 h-20 w-20 opacity-50" />
                      <p className="text-lg font-bold">
                        {hasSemanticQuery
                          ? 'ไม่พบเอกสารที่ตรงกับเนื้อหาภายในไฟล์'
                          : 'ไม่พบข้อมูล'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDocuments.map((document) => {
                  const docType = docTypes.find((item) => item._id === document.typeId);
                  const canEdit =
                    currentUser.role === 'admin' ||
                    document.ownerId === currentUser.username ||
                    document.ownerId === currentUser._id;
                  const semanticScore = semanticScores.get(document._id) ?? 0;

                  return (
                    <tr
                      className="group transition-colors hover:bg-amber-50/50 dark:hover:bg-slate-800/50"
                      key={document._id}
                    >
                      <td className="px-6 py-4">
                        <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 font-mono text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {document.docNo || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className="max-w-md truncate font-bold text-slate-900 transition-colors group-hover:text-blue-900 dark:text-white dark:group-hover:text-amber-500"
                          onClick={() => setViewingDoc(document)}
                        >
                          {document.subject || '-'}
                        </div>
                        <div className="mt-1 text-xs font-bold text-slate-500">
                          <Building2 className="mr-1 inline h-3.5 w-3.5" />
                          จาก: {document.origin || '-'}
                        </div>
                        {hasSemanticQuery && semanticScore > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {(document.semanticKeywords ?? []).slice(0, 4).map((keyword) => (
                              <span
                                className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                                key={`${document._id}-${keyword}`}
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="rounded-xl border px-3.5 py-1.5 text-xs font-bold tracking-wide shadow-sm"
                          style={{
                            color: docType?.color || '#94a3b8',
                            borderColor: `${docType?.color || '#94a3b8'}30`,
                            backgroundColor: `${docType?.color || '#94a3b8'}10`,
                          }}
                        >
                          {docType?.name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm font-bold">
                        {document.fiscalYear || '-'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold">
                        {formatThaiDate(document.date)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex items-center justify-end opacity-70 transition-opacity group-hover:opacity-100">
                          <button
                            className="mx-1 rounded-xl border border-transparent p-2.5 text-slate-400 shadow-sm transition-all hover:border-slate-200 hover:bg-white hover:text-blue-900 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                            onClick={() => setViewingDoc(document)}
                            title="ดูรายละเอียด"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          {canEdit && (
                            <>
                              <button
                                className="mx-1 rounded-xl border border-transparent p-2.5 text-slate-400 shadow-sm transition-all hover:border-slate-200 hover:bg-white hover:text-amber-600 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                                onClick={() => setEditingDoc(document)}
                                title="แก้ไข"
                              >
                                <Edit2 className="h-5 w-5" />
                              </button>
                              <button
                                className="ml-1 rounded-xl border border-transparent p-2.5 text-slate-400 shadow-sm transition-all hover:border-slate-200 hover:bg-white hover:text-red-600 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                                onClick={() => handleDelete(document._id)}
                                title="ลบ"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50/50 p-5 text-sm dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-xs font-bold text-slate-500">
            {(currentPage - 1) * itemsPerPage + (paginatedDocuments.length > 0 ? 1 : 0)} -{' '}
            {Math.min(currentPage * itemsPerPage, filteredDocs.length)} / {filteredDocs.length}
          </p>
          <div className="flex space-x-1.5">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-transparent shadow-sm transition hover:border-slate-200 hover:bg-white disabled:opacity-50 dark:hover:border-slate-700 dark:hover:bg-slate-800"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-900 text-sm font-bold text-white shadow-md">
              {currentPage}
            </span>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-transparent shadow-sm transition hover:border-slate-200 hover:bg-white disabled:opacity-50 dark:hover:border-slate-700 dark:hover:bg-slate-800"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {editingDoc && (
        <DocFormModal
          currentUser={currentUser}
          doc={editingDoc}
          docTypes={docTypes}
          onClose={() => setEditingDoc(null)}
          onSave={handleSave}
        />
      )}
      {viewingDoc && (
        <DocViewModal
          currentUser={currentUser}
          doc={viewingDoc}
          docTypes={docTypes}
          onClose={() => setViewingDoc(null)}
          onEdit={() => {
            setEditingDoc(viewingDoc);
            setViewingDoc(null);
          }}
        />
      )}
    </div>
  );
}
