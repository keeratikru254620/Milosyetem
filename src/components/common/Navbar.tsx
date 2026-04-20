import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { getPageTitle } from '../../constants/views';
import RealTimeClock from '../layout/RealTimeClock';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const location = useLocation();

  return (
    <header className="luxury-panel z-10 mx-4 mt-4 flex min-h-24 shrink-0 items-center justify-between rounded-[1.8rem] px-6 py-5 shadow-[0_20px_48px_rgba(32,41,59,0.1)] sm:mx-6 lg:mx-8 dark:border-slate-800/70 dark:bg-[rgba(12,20,37,0.82)]">
      <div className="flex min-w-0 items-center">
        <button
          className="mr-4 rounded-2xl p-2.5 text-slate-600 transition hover:bg-white/70 active:scale-95 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          onClick={onMenuClick}
          type="button"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="min-w-0">
          <p className="luxury-kicker mb-1">
            Government Archive Suite
          </p>
          <h1 className="luxury-heading text-[1.55rem] font-semibold leading-[1.12] tracking-[-0.01em] text-slate-900 sm:text-[1.8rem] dark:text-white">
            {getPageTitle(location.pathname)}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-5">
        <RealTimeClock />
        <div className="hidden items-center rounded-full border border-[rgba(192,139,47,0.18)] bg-[rgba(255,250,242,0.86)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--app-navy)] shadow-sm sm:flex dark:border-[rgba(224,177,91,0.22)] dark:bg-[rgba(16,24,40,0.9)] dark:text-[var(--app-gold-soft)]">
          <span className="mr-2 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse"></span>
          พร้อมใช้งาน
        </div>
      </div>
    </header>
  );
}
