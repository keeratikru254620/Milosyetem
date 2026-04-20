import {
  FolderArchive,
  LayoutDashboard,
  LogOut,
  Settings,
  Tags,
  UsersRound,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

import AvatarCircle from '../../components/common/AvatarCircle';
import { APP_PATHS } from '../../constants/views';
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
      {isOpen ? (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={`luxury-panel fixed z-30 flex h-screen w-[20rem] flex-col border-r border-[var(--panel-border)] bg-[rgba(255,250,242,0.92)] shadow-[12px_0_45px_rgba(32,41,59,0.12)] backdrop-blur-2xl transition-transform duration-300 ease-out lg:relative lg:translate-x-0 lg:shadow-none dark:border-slate-800 dark:bg-[rgba(10,18,33,0.94)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 border-b border-[var(--panel-border)] bg-[rgba(255,255,255,0.28)] px-4 py-4 dark:border-slate-800/50 dark:bg-transparent">
          <div className="flex h-[4.6rem] w-[4.6rem] shrink-0 items-center justify-center overflow-hidden rounded-[1.45rem] border border-white/75 bg-[rgba(255,255,255,0.9)] p-2.5 shadow-[0_18px_40px_rgba(32,41,59,0.12)]">
            <img
              alt="โลโก้ระบบ"
              className="h-full w-full scale-[1.08] object-contain contrast-[1.14] saturate-125 drop-shadow-[0_12px_24px_rgba(15,23,42,0.22)]"
              onError={(event) => {
                const target = event.currentTarget;
                target.onerror = null;
                target.src = APP_LOGO_FALLBACK;
              }}
              src={APP_LOGO_SRC}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="luxury-heading truncate whitespace-nowrap text-[1.04rem] font-semibold leading-none tracking-[-0.03em] text-slate-900 dark:text-white">
              ระบบจัดเก็บเอกสารราชการ
            </h2>
            <p className="luxury-kicker mt-2 text-[10px] tracking-[0.26em] dark:text-[var(--app-gold-soft)]">
              Gov-Doc Pro
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto py-2">
          <div className="mt-2 px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--app-gold)] dark:text-[var(--app-gold-soft)]">
            เมนูหลัก
          </div>
          <NavItem
            icon={LayoutDashboard}
            isActive={isActiveRoute(APP_PATHS.dashboard)}
            label="ภาพรวมระบบ"
            onClick={onClose}
            to={resolveRoute(APP_PATHS.dashboard)}
          />
          <NavItem
            icon={FolderArchive}
            isActive={isActiveRoute(APP_PATHS.documents)}
            label="ทะเบียนรับ-ส่งเอกสาร"
            onClick={onClose}
            to={resolveRoute(APP_PATHS.documents)}
          />

          <div className="mt-4 px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--app-gold)] dark:text-[var(--app-gold-soft)]">
            จัดการข้อมูล
          </div>
          <NavItem
            icon={Tags}
            isActive={isActiveRoute(APP_PATHS.docTypes)}
            label="ประเภทเอกสาร"
            onClick={onClose}
            to={resolveRoute(APP_PATHS.docTypes)}
          />
          {currentUser.role === 'admin' ? (
            <NavItem
              icon={UsersRound}
              isActive={isActiveRoute(APP_PATHS.users)}
              label="จัดการบุคลากร"
              onClick={onClose}
              to={resolveRoute(APP_PATHS.users)}
            />
          ) : null}
        </nav>

        <div className="flex flex-col gap-5 border-t border-[var(--panel-border)] bg-[rgba(255,255,255,0.35)] p-5 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-center space-x-3 overflow-hidden px-1">
            <AvatarCircle
              className="h-11 w-11 shrink-0 border-2 border-white dark:border-slate-800"
              name={currentUser.name}
              src={currentUser.avatar}
              textClassName="text-lg"
            />
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-base font-bold text-slate-900 dark:text-white">
                {currentUser.name}
              </p>
              <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--app-gold)] dark:text-[var(--app-gold-soft)]">
                {getRoleText(currentUser.role)}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <NavItemButton
              icon={Settings}
              label="การตั้งค่า"
              onClick={onClose}
              to={resolveRoute(APP_PATHS.settingsProfile)}
            />
            <button
              className="flex-1 rounded-xl border border-red-100 bg-red-50 py-2.5 text-xs font-bold text-red-600 shadow-sm transition hover:bg-red-100 active:scale-95 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
              onClick={() => void handleLogoutClick()}
              type="button"
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
