import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { getPageTitle } from '../../utils/format';
import RealTimeClock from './RealTimeClock';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();

  return (
    <header className="z-10 flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-6 shadow-sm backdrop-blur-xl dark:border-slate-800/50 dark:bg-[#0B1120]/80">
      <div className="flex items-center">
        <button
          className="mr-4 rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 active:scale-95 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          onClick={onMenuClick}
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
          {getPageTitle(location.pathname)}
        </h1>
      </div>
      <div className="flex items-center gap-5">
        <RealTimeClock />
        <div className="hidden items-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-emerald-700 shadow-sm sm:flex dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
          <span className="mr-2 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
          Online
        </div>
      </div>
    </header>
  );
}
