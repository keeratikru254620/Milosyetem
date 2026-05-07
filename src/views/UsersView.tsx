import { Edit2, Search, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const roster = users.some((user) => user._id === currentUser._id)
    ? users
    : [currentUser, ...users];
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const sortedUsers = [...roster].sort((left, right) =>
    left.name.localeCompare(right.name, 'th'),
  );
  const filteredUsers = sortedUsers.filter((user) => {
    if (!normalizedSearchTerm) {
      return true;
    }

    return [user.name, user.username, user.email, getRoleText(user.role)]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(normalizedSearchTerm));
  });
  const adminCount = roster.filter((user) => user.role === 'admin').length;
  const officerCount = roster.length - adminCount;

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
      return 'metal-badge border-white/10 text-[#4c2a70] dark:text-[var(--app-gold-soft)]';
    }

    if (role === 'general') {
      return 'metal-badge border-white/10 text-[#17643f] dark:text-[#d9efe2]';
    }

    return 'metal-badge border-white/10 text-[#1e4f7a] dark:text-[#dbeafe]';
  };

  return (
    <div className="luxury-panel flex min-h-[calc(100dvh-7rem)] flex-col overflow-hidden rounded-3xl animate-slide-blur lg:h-[calc(100vh-140px)]">
      <div className="metal-section-band flex shrink-0 flex-col gap-4 border-b border-white/10 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
        <h2 className="flex items-center text-lg font-bold text-slate-900 dark:text-white">
          <Users className="mr-3 h-5 w-5 text-[var(--app-gold)]" /> จัดการบุคลากร
        </h2>
        <button
          className="metal-button-primary flex w-full items-center justify-center rounded-xl px-6 py-2.5 text-sm font-bold transition-all hover:brightness-105 active:scale-95 md:w-auto"
          onClick={() => setEditingUser({})}
          type="button"
        >
          <UserPlus className="mr-2 h-4 w-4" /> เพิ่มบุคลากร
        </button>
      </div>

      <div className="grid shrink-0 gap-4 border-b border-white/10 p-5 sm:grid-cols-3 sm:p-6">
        <div className="luxury-panel-soft rounded-2xl px-5 py-4">
          <p className="luxury-kicker mb-1 text-[10px]">Total Users</p>
          <p className="font-display text-3xl font-bold leading-none text-slate-900 dark:text-white">
            {roster.length}
          </p>
        </div>
        <div className="luxury-panel-soft rounded-2xl px-5 py-4">
          <p className="luxury-kicker mb-1 text-[10px]">Admin / Staff</p>
          <p className="flex items-center gap-2 font-display text-3xl font-bold leading-none text-slate-900 dark:text-white">
            <ShieldCheck className="h-6 w-6 text-[var(--app-gold)]" />
            {adminCount}
            <span className="text-lg text-[var(--app-text-soft)]">/ {officerCount}</span>
          </p>
        </div>
        <div className="group relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[var(--app-gold)]" />
          <input
            className="metal-control h-full min-h-[4.7rem] w-full rounded-2xl pl-12 pr-4 text-sm font-semibold outline-none transition-all dark:text-white"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="ค้นหาชื่อ อีเมล หรือสิทธิ์"
            type="search"
            value={searchTerm}
          />
        </div>
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
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
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
                          aria-label={`แก้ไข ${user.name}`}
                          onClick={() => setEditingUser(user)}
                          title="แก้ไข"
                          type="button"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          className="metal-icon-shell ml-1 rounded-lg p-2 text-slate-400 transition hover:text-red-400 disabled:opacity-30 disabled:hover:text-slate-400"
                          aria-label={`ลบ ${user.name}`}
                          disabled={isMe}
                          onClick={() => handleDelete(user._id)}
                          title={isMe ? 'ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่ได้' : 'ลบ'}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-6 py-12 text-center text-sm font-semibold text-slate-500 dark:text-slate-300" colSpan={4}>
                  ไม่พบข้อมูลบุคลากรที่ตรงกับคำค้นหา
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <UserFormModal
          allUsers={roster}
          onClose={() => setEditingUser(null)}
          onSave={onSaveUser}
          user={editingUser}
        />
      )}
    </div>
  );
}
