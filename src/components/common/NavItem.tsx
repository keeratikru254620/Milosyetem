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
          ? 'border-[rgba(192,139,47,0.24)] bg-[linear-gradient(135deg,var(--app-navy),var(--app-navy-deep))] font-bold text-white shadow-[0_16px_26px_rgba(35,59,132,0.24)] dark:border-[rgba(224,177,91,0.24)] dark:text-[var(--app-gold-soft)]'
          : 'border-transparent font-semibold text-slate-600 hover:border-[rgba(192,139,47,0.14)] hover:bg-white/75 hover:text-[var(--app-title)] dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white'
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
            : 'text-slate-400 group-hover:text-[var(--app-gold)] dark:group-hover:text-[var(--app-gold-soft)]'
        }`}
      />
      <span className="z-10">{label}</span>
    </button>
  );
}
