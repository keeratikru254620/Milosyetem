import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

export default function NavItem({ to, icon: Icon, label, isActive, onClick }: NavItemProps) {
  const navigate = useNavigate();

  return (
    <button
      className={`group relative mx-4 mb-1 flex w-full items-center overflow-hidden rounded-2xl border px-5 py-3.5 text-sm transition-all ${
        isActive
          ? 'border-transparent bg-blue-900 font-bold text-white shadow-md dark:border-blue-900/30 dark:bg-blue-900/40 dark:text-amber-400 dark:shadow-none'
          : 'border-transparent font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white'
      }`}
      onClick={() => {
        navigate(to);
        onClick?.();
      }}
      style={{ width: 'calc(100% - 2rem)' }}
    >
      <Icon
        className={`z-10 mr-3 h-5 w-5 transition-colors ${
          isActive
            ? 'text-white dark:text-amber-400'
            : 'text-slate-400 group-hover:text-blue-600 dark:group-hover:text-amber-500'
        }`}
      />
      <span className="z-10">{label}</span>
    </button>
  );
}
