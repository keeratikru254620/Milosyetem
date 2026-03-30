import type { FormEvent } from 'react';
import { UserCog, UserPlus, X } from 'lucide-react';
import { useState } from 'react';

import { showToast } from '../../services/toastService';
import type { SaveUserInput, User } from '../../types';

interface UserFormModalProps {
  allUsers: User[];
  onClose: () => void;
  onSave: (data: SaveUserInput, id?: string) => Promise<unknown> | unknown;
  user: Partial<User>;
}

export default function UserFormModal({
  allUsers,
  onClose,
  onSave,
  user,
}: UserFormModalProps) {
  const isEdit = Boolean(user._id);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    username: user.username ?? '',
    password: '',
    name: user.name ?? '',
    role:
      user.role === 'admin' || user.role === 'officer' || user.role === 'general'
        ? user.role
        : 'officer',
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    if (
      !isEdit &&
      allUsers.some(
        (current) => current.username.toLowerCase() === form.username.trim().toLowerCase(),
      )
    ) {
      showToast('มีผู้ใช้งานระบบนี้อยู่แล้ว', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const payload: SaveUserInput = {
        name: form.name.trim(),
        role: form.role,
      };

      if (!isEdit) {
        payload.username = form.username.trim();
      }

      if (form.password.trim()) {
        payload.password = form.password;
      }

      await onSave(payload, user._id);
      showToast(isEdit ? 'อัปเดตผู้ใช้งานสำเร็จ' : 'เพิ่มผู้ใช้งานสำเร็จ');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 transform animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5 dark:border-slate-800 dark:bg-slate-800/30">
          <h3 className="flex items-center text-lg font-bold text-slate-900 dark:text-white">
            {isEdit ? (
              <UserCog className="mr-2 h-5 w-5 text-blue-900 dark:text-amber-500" />
            ) : (
              <UserPlus className="mr-2 h-5 w-5 text-blue-900 dark:text-amber-500" />
            )}
            {isEdit ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งาน'}
          </h3>
          <button
            className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500 active:scale-95 dark:hover:bg-red-500/10"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-6 p-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1.5 block text-xs font-bold text-slate-500 dark:text-slate-400">
                USERNAME
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm outline-none transition-all focus:border-blue-900 focus:bg-white read-only:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-900 dark:read-only:bg-slate-800"
                onChange={(event) =>
                  setForm((current) => ({ ...current, username: event.target.value }))
                }
                readOnly={isEdit}
                required={!isEdit}
                type="text"
                value={form.username}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1.5 block text-xs font-bold text-slate-500 dark:text-slate-400">
                PASSWORD
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm outline-none transition-all focus:border-blue-900 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-900"
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder={isEdit ? '(เว้นว่างถ้าไม่เปลี่ยน)' : ''}
                required={!isEdit}
                type="password"
                value={form.password}
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-bold text-slate-500 dark:text-slate-400">
                ชื่อ-นามสกุล
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
            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-bold text-slate-500 dark:text-slate-400">
                สิทธิ์การใช้งาน
              </label>
              <select
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-blue-900 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-900"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    role: event.target.value as User['role'],
                  }))
                }
                value={form.role}
              >
                <option value="general">บุคคลทั่วไป (General)</option>
                <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                <option value="officer">เจ้าหน้าที่ (Officer)</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              onClick={onClose}
              type="button"
            >
              ยกเลิก
            </button>
            <button
              className="rounded-xl border border-blue-800 bg-blue-900 px-8 py-3 text-sm font-bold text-white shadow-md shadow-blue-900/20 transition hover:bg-blue-950 active:scale-95 disabled:opacity-50"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? 'กำลังประมวลผล...' : 'บันทึกข้อมูล'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
