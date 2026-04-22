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
          ? 'border-[rgba(231,220,252,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.02)_28%),linear-gradient(135deg,#7c58ad_0%,#462a68_56%,#170f22_100%)] font-bold text-white shadow-[0_16px_28px_rgba(29,18,44,0.28)]'
          : 'border-transparent bg-transparent font-semibold text-slate-700 hover:border-white/12 hover:bg-white/6 hover:text-[var(--app-title)] dark:text-slate-200 dark:hover:bg-white/6 dark:hover:text-white'
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
            ? 'text-[var(--app-gold-soft)] dark:text-[var(--app-gold-soft)]'
            : 'text-slate-400 group-hover:text-[var(--app-navy)] dark:text-slate-400 dark:group-hover:text-[var(--app-gold-soft)]'
        }`}
      />
      <span className="z-10">{label}</span>
    </button>
  );
}
