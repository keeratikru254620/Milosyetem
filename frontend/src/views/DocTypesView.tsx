import type { FormEvent } from 'react';
import { Edit2, Tag, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { confirmDialog } from '../services/confirmService';
import { showToast } from '../services/toastService';
import type { DocType, DocumentData, SaveDocTypeInput } from '../types';
import { getApiErrorMessage } from '../utils/apiError';

interface DocTypesViewProps {
  docTypes: DocType[];
  documents: DocumentData[];
  onDeleteDocType: (id: string) => Promise<unknown> | unknown;
  onSaveDocType: (data: SaveDocTypeInput, id?: string) => Promise<unknown> | unknown;
}

export default function DocTypesView({
  docTypes,
  documents,
  onDeleteDocType,
  onSaveDocType,
}: DocTypesViewProps) {
  const [editing, setEditing] = useState<DocType | null>(null);
  const [form, setForm] = useState({
    name: '',
    color: '#1e3a8a',
  });

  const resetForm = () => {
    setEditing(null);
    setForm({ name: '', color: '#1e3a8a' });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedName = form.name.trim().toLowerCase();
    const duplicate = docTypes.find(
      (docType) =>
        docType.name.trim().toLowerCase() === normalizedName && docType._id !== editing?._id,
    );

    if (duplicate) {
      showToast('มีหมวดหมู่นี้อยู่แล้ว', 'error');
      return;
    }

    try {
      await onSaveDocType(
        {
          name: form.name.trim(),
          color: form.color,
        },
        editing?._id,
      );
      showToast(editing ? 'อัปเดตประเภทเอกสารสำเร็จ' : 'เพิ่มประเภทเอกสารสำเร็จ');
      resetForm();
    } catch (error) {
      showToast(
        getApiErrorMessage(error, {
          fallbackMessage: editing
            ? 'อัปเดตประเภทเอกสารไม่สำเร็จ'
            : 'เพิ่มประเภทเอกสารไม่สำเร็จ',
        }),
        'error',
      );
    }
  };

  const handleDelete = async (docType: DocType, count: number) => {
    if (count > 0) {
      showToast('ไม่สามารถลบได้ มีเอกสารใช้งานอยู่', 'error');
      return;
    }

    const confirmed = await confirmDialog(
      'ลบประเภทเอกสาร',
      `คุณต้องการลบ "${docType.name}" ใช่หรือไม่?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await onDeleteDocType(docType._id);
      showToast('ลบประเภทเอกสารสำเร็จ');

      if (editing?._id === docType._id) {
        resetForm();
      }
    } catch (error) {
      showToast(
        getApiErrorMessage(error, {
          fallbackMessage: 'ลบประเภทเอกสารไม่สำเร็จ',
        }),
        'error',
      );
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 animate-slide-blur lg:grid-cols-3">
      <div className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <h2 className="mb-6 flex items-center text-lg font-bold text-slate-900 dark:text-white">
          <Tag className="mr-3 h-5 w-5 text-blue-900 dark:text-amber-500" />{' '}
          {editing ? 'แก้ไขประเภท' : 'เพิ่มประเภทเอกสาร'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              ชื่อประเภท
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-blue-900 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-900"
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              required
              type="text"
              value={form.name}
            />
          </div>
          <div className="mb-6">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              สีประจำประเภท
            </label>
            <div className="flex items-center gap-3">
              <input
                className="h-12 w-16 cursor-pointer rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-950"
                onChange={(event) =>
                  setForm((current) => ({ ...current, color: event.target.value }))
                }
                type="color"
                value={form.color}
              />
              <input
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm outline-none transition-all focus:border-blue-900 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-900"
                onChange={(event) =>
                  setForm((current) => ({ ...current, color: event.target.value }))
                }
                type="text"
                value={form.color}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              className="flex-1 rounded-xl border border-blue-800 bg-blue-900 py-3 text-sm font-bold text-white shadow-md shadow-blue-900/20 transition hover:bg-blue-950 active:scale-95"
              type="submit"
            >
              บันทึก
            </button>
            {editing && (
              <button
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                onClick={resetForm}
                type="button"
              >
                ยกเลิก
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500">
              <th className="px-6 py-4">ประเภทเอกสาร</th>
              <th className="px-6 py-4 text-center">จำนวนในระบบ</th>
              <th className="px-6 py-4 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
            {[...docTypes]
              .sort((left, right) => left.name.localeCompare(right.name, 'th'))
              .map((docType) => {
                const count = documents.filter((document) => document.typeId === docType._id).length;

                return (
                  <tr
                    className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    key={docType._id}
                  >
                    <td className="flex items-center gap-4 px-6 py-4">
                      <span
                        className="h-4 w-4 rounded-full shadow-sm"
                        style={{ backgroundColor: docType.color }}
                      ></span>
                      <span className="font-bold text-slate-800 dark:text-white">
                        {docType.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {count}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="opacity-70 transition-opacity group-hover:opacity-100">
                        <button
                          className="mx-1 rounded-lg border border-transparent bg-white p-2 text-slate-400 transition hover:border-slate-200 hover:text-amber-600 dark:bg-slate-800 dark:hover:border-slate-700"
                          onClick={() => {
                            setEditing(docType);
                            setForm({
                              name: docType.name,
                              color: docType.color,
                            });
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          className="ml-1 rounded-lg border border-transparent bg-white p-2 text-slate-400 transition hover:border-slate-200 hover:text-red-600 dark:bg-slate-800 dark:hover:border-slate-700"
                          onClick={() => handleDelete(docType, count)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
