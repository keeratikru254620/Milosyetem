import { Edit2, Trash2, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';

import UserFormModal from '../components/modals/UserFormModal';
import { confirmDialog } from '../services/confirmService';
import { showToast } from '../services/toastService';
import type { SaveUserInput, User } from '../types';
import { getErrorMessage } from '../utils/auth';
import { getRoleText } from '../utils/format';

interface UsersViewProps {
  currentUser: User;
  onDeleteUser: (id: string) => Promise<unknown> | unknown;
  onSaveUser: (data: SaveUserInput, id?: string) => Promise<unknown> | unknown;
  users: User[];
}

export default function UsersView({
  currentUser,
  onDeleteUser,
  onSaveUser,
  users,
}: UsersViewProps) {
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog(
      'ลบผู้ใช้งาน',
      'ยืนยันการลบผู้ใช้งานนี้อย่างถาวร?',
    );

    if (!confirmed) {
      return;
    }

    try {
      await onDeleteUser(id);
      showToast('ลบผู้ใช้งานสำเร็จ');
    } catch (error) {
      showToast(
        getErrorMessage(error, {
          fallbackMessage: 'ไม่สามารถลบผู้ใช้งานได้',
        }),
        'error',
      );
    }
  };

  const getRoleBadgeStyles = (role: User['role']) => {
    if (role === 'admin') {
      return 'metal-badge text-[var(--app-gold-soft)] border-white/10';
    }

    if (role === 'general') {
      return 'metal-badge text-[#d9efe2] border-white/10';
    }

    return 'metal-badge text-slate-200 border-white/10';
  };

  return (
    <div className="luxury-panel flex h-[calc(100vh-140px)] flex-col overflow-hidden rounded-3xl animate-slide-blur">
      <div className="metal-section-band flex shrink-0 items-center justify-between border-b border-white/10 p-5 sm:p-6">
        <h2 className="flex items-center text-lg font-bold text-slate-900 dark:text-white">
          <Users className="mr-3 h-5 w-5 text-[var(--app-gold)]" /> จัดการบุคลากร
        </h2>
        <button
          className="metal-button-primary flex items-center rounded-xl px-6 py-2.5 text-sm font-bold transition-all hover:brightness-105 active:scale-95"
          onClick={() => setEditingUser({})}
        >
          <UserPlus className="mr-2 h-4 w-4" /> เพิ่มบุคลากร
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead className="sticky top-0 z-10 border-b border-white/10 bg-[rgba(78,86,96,0.76)] shadow-sm backdrop-blur-md">
            <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <th className="px-6 py-4">USERNAME</th>
              <th className="px-6 py-4">ชื่อ-สกุล</th>
              <th className="px-6 py-4">สิทธิ์การใช้งาน</th>
              <th className="px-6 py-4 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
            {[...users]
              .sort((left, right) => left.name.localeCompare(right.name, 'th'))
              .map((user) => {
                const isMe = user._id === currentUser._id;

                return (
                  <tr className="group transition-colors hover:bg-white/6" key={user._id}>
                    <td className="px-6 py-4 font-mono text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                      {user.name}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-lg border px-3 py-1.5 text-[10px] font-bold ${getRoleBadgeStyles(
                          user.role,
                        )}`}
                      >
                        {getRoleText(user.role)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="opacity-70 transition-opacity group-hover:opacity-100">
                        <button
                          className="metal-icon-shell mx-1 rounded-lg p-2 text-slate-400 transition hover:text-[var(--app-gold)]"
                          onClick={() => setEditingUser(user)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          className="metal-icon-shell ml-1 rounded-lg p-2 text-slate-400 transition hover:text-red-400 disabled:opacity-30 disabled:hover:text-slate-400"
                          disabled={isMe}
                          onClick={() => handleDelete(user._id)}
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

      {editingUser && (
        <UserFormModal
          allUsers={users}
          onClose={() => setEditingUser(null)}
          onSave={onSaveUser}
          user={editingUser}
        />
      )}
    </div>
  );
}
