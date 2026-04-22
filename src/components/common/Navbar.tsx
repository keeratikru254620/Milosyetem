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
    <header className="luxury-panel z-10 mx-4 mt-4 flex min-h-24 shrink-0 items-center justify-between rounded-[1.85rem] px-6 py-5 sm:mx-6 lg:mx-8">
      <div className="flex min-w-0 items-center">
        <button
          className="metal-icon-shell mr-4 rounded-2xl p-2.5 text-slate-600 transition hover:text-[var(--app-gold)] active:scale-95 lg:hidden dark:text-slate-200"
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
        <div className="metal-status-pill hidden items-center rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] sm:flex">
          <span className="mr-2 h-2 w-2 rounded-full bg-[var(--app-navy)] shadow-[0_0_14px_rgba(155,120,199,0.48)] animate-pulse"></span>
          พร้อมใช้งาน
        </div>
      </div>
    </header>
  );
}
