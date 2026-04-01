import { Edit2, Trash2, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';

import UserFormModal from '../components/modals/UserFormModal';
import { confirmDialog } from '../services/confirmService';
import { showToast } from '../services/toastService';
import type { SaveUserInput, User } from '../types';
import { getErrorMessage } from '../utils/errorMessage';
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
      return 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
    }

    if (role === 'general') {
      return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
    }

    return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
  };

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm animate-slide-blur dark:border-slate-800 dark:bg-slate-900">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/50 sm:p-6">
        <h2 className="flex items-center text-lg font-bold text-slate-900 dark:text-white">
          <Users className="mr-3 h-5 w-5 text-blue-900 dark:text-amber-500" /> จัดการบุคลากร
        </h2>
        <button
          className="flex items-center rounded-xl border border-blue-800 bg-blue-900 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-900/20 transition-all hover:bg-blue-950 active:scale-95"
          onClick={() => setEditingUser({})}
        >
          <UserPlus className="mr-2 h-4 w-4" /> เพิ่มบุคลากร
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
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
                  <tr
                    className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    key={user._id}
                  >
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
                          className="mx-1 rounded-lg border border-transparent bg-white p-2 text-slate-400 transition hover:border-slate-200 hover:text-amber-600 dark:bg-slate-800 dark:hover:border-slate-700"
                          onClick={() => setEditingUser(user)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          className="ml-1 rounded-lg border border-transparent bg-white p-2 text-slate-400 transition hover:border-slate-200 hover:text-red-600 disabled:opacity-30 disabled:hover:border-transparent disabled:hover:text-slate-400 dark:bg-slate-800 dark:hover:border-slate-700"
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
