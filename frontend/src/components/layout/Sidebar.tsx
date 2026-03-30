import {
  FolderArchive,
  LayoutDashboard,
  LogOut,
  Settings,
  Tags,
  UsersRound,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { confirmDialog } from '../../services/confirmService';
import type { User } from '../../types';
import { APP_LOGO_FALLBACK, APP_LOGO_SRC } from '../../utils/assets';
import { getRoleText } from '../../utils/format';
import NavItem from '../common/NavItem';
import NavItemButton from '../common/NavItemButton';

interface SidebarProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => Promise<void> | void;
  routePrefix?: string;
}

export default function Sidebar({
  currentUser,
  isOpen,
  onClose,
  onLogout,
  routePrefix = '',
}: SidebarProps) {
  const location = useLocation();
  const resolveRoute = (path: string) => `${routePrefix}${path}`;
  const isActiveRoute = (path: string) => {
    const resolvedPath = resolveRoute(path);

    return location.pathname === resolvedPath || location.pathname.startsWith(`${resolvedPath}/`);
  };

  const handleLogoutClick = async () => {
    const confirmed = await confirmDialog('ออกจากระบบ', 'คุณต้องการออกจากระบบใช่หรือไม่?');

    if (confirmed) {
      await onLogout();
      onClose();
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={onClose}
        ></div>
      )}

      <aside
        className={`fixed z-30 flex h-screen w-72 flex-col border-r border-slate-100 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 ease-out lg:relative lg:translate-x-0 lg:shadow-none dark:border-slate-800 dark:bg-[#0F172A] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center border-b border-slate-100 bg-white px-6 py-5.5 dark:border-slate-800/50 dark:bg-transparent">
          <div className="mr-4 flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl p-0.5">
            <img
              alt="โลโก้ บก.สอท.1"
              className="h-full w-full scale-[1.04] object-contain contrast-[1.12] saturate-110 drop-shadow-[0_10px_18px_rgba(15,23,42,0.16)]"
              onError={(event) => {
                const target = event.currentTarget;
                target.onerror = null;
                target.src = APP_LOGO_FALLBACK;
              }}
              src={APP_LOGO_SRC}
            />
          </div>
          <div className="flex flex-col">
            <h2 className="text-base font-bold leading-[1.18] tracking-tight text-slate-900 dark:text-white">
              ระบบจัดเก็บเอกสาร
              <br />
              ราชการ
            </h2>
            <p className="mt-1.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-500">
              GOV-DOC PRO
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto py-2">
          <div className="mt-2 px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            MAIN MENU
          </div>
          <NavItem
            icon={LayoutDashboard}
            isActive={isActiveRoute('/dashboard')}
            label="ภาพรวมระบบ"
            onClick={onClose}
            to={resolveRoute('/dashboard')}
          />
          <NavItem
            icon={FolderArchive}
            isActive={isActiveRoute('/documents')}
            label="ทะเบียนรับ-ส่งเอกสาร"
            onClick={onClose}
            to={resolveRoute('/documents')}
          />

          <div className="mt-4 px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            MANAGEMENT
          </div>
          <NavItem
            icon={Tags}
            isActive={isActiveRoute('/doctypes')}
            label="ประเภทเอกสาร"
            onClick={onClose}
            to={resolveRoute('/doctypes')}
          />
          {currentUser.role === 'admin' && (
            <NavItem
              icon={UsersRound}
              isActive={isActiveRoute('/users')}
              label="จัดการบุคลากร"
              onClick={onClose}
              to={resolveRoute('/users')}
            />
          )}
        </nav>

        <div className="flex flex-col gap-5 border-t border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center space-x-3 overflow-hidden px-1">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-amber-500 text-xl font-bold text-white shadow-sm dark:border-slate-800">
              {currentUser.avatar ? (
                <img
                  alt="avatar"
                  className="h-full w-full object-cover"
                  src={currentUser.avatar}
                />
              ) : (
                currentUser.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                {currentUser.name}
              </p>
              <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {getRoleText(currentUser.role)}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <NavItemButton
              icon={Settings}
              label="การตั้งค่า"
              onClick={onClose}
              to={resolveRoute('/settings/profile')}
            />
            <button
              className="flex-1 rounded-xl border border-red-100 bg-red-50 py-2.5 text-xs font-bold text-red-600 shadow-sm transition hover:bg-red-100 active:scale-95 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
              onClick={handleLogoutClick}
            >
              <span className="flex items-center justify-center">
                <LogOut className="mr-1.5 h-4 w-4" /> ออก
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
