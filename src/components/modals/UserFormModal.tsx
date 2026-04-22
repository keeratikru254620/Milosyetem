import type { FormEvent } from 'react';
import { UserCog, UserPlus } from 'lucide-react';
import { useState } from 'react';

import { showToast } from '../../services/toastService';
import type { SaveUserInput, User } from '../../types';
import { getErrorMessage } from '../../utils/auth';
import Modal from '../common/Modal';

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
      showToast('มีผู้ใช้งานนี้อยู่ในระบบแล้ว', 'error');
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
        payload.email = form.username.trim();
      }

      if (form.password.trim()) {
        payload.password = form.password;
      }

      await onSave(payload, user._id);
      showToast(isEdit ? 'อัปเดตผู้ใช้งานสำเร็จ' : 'เพิ่มผู้ใช้งานสำเร็จ');
      onClose();
    } catch (error) {
      showToast(
        getErrorMessage(error, {
          duplicateMessage: 'มีผู้ใช้งานนี้อยู่ในระบบแล้ว',
          fallbackMessage: isEdit ? 'อัปเดตผู้ใช้งานไม่สำเร็จ' : 'เพิ่มผู้ใช้งานไม่สำเร็จ',
        }),
        'error',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      icon={isEdit ? UserCog : UserPlus}
      maxWidthClassName="max-w-lg"
      onClose={onClose}
      title={isEdit ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งาน'}
    >
      <form className="space-y-6 p-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-5">
          <div className="col-span-2 sm:col-span-1">
            <label className="mb-1.5 block text-xs font-bold text-slate-500 dark:text-slate-400">
              USERNAME
            </label>
            <input
              className="metal-control w-full rounded-xl px-4 py-3 font-mono text-sm outline-none transition-all read-only:opacity-80 dark:text-white"
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
              className="metal-control w-full rounded-xl px-4 py-3 font-mono text-sm outline-none transition-all dark:text-white"
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
              className="metal-control w-full rounded-xl px-4 py-3 text-sm outline-none transition-all dark:text-white"
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
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
              className="metal-control w-full appearance-none rounded-xl px-4 py-3 text-sm outline-none transition-all dark:text-white"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  role: event.target.value as User['role'],
                }))
              }
              value={form.role}
            >
              <option value="general">เจ้าหน้าที่ตำรวจ</option>
              <option value="admin">ผู้ดูแลระบบ</option>
              <option value="officer">เจ้าหน้าที่</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            className="metal-button-secondary rounded-xl px-6 py-3 text-sm font-bold transition active:scale-95"
            onClick={onClose}
            type="button"
          >
            ยกเลิก
          </button>
          <button
            className="metal-button-primary rounded-xl px-8 py-3 text-sm font-bold transition hover:brightness-105 active:scale-95 disabled:opacity-50"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? 'กำลังประมวลผล...' : 'บันทึกข้อมูล'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
