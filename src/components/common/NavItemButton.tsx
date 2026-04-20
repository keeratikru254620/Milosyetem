import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavItemButtonProps {
  to: string;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}

export default function NavItemButton({
  to,
  icon: Icon,
  label,
  onClick,
}: NavItemButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      className="flex-1 rounded-xl border border-[var(--panel-border)] bg-[rgba(255,255,255,0.8)] py-2.5 text-xs font-bold text-[var(--app-title)] shadow-sm transition hover:bg-white active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      onClick={() => {
        navigate(to);
        onClick?.();
      }}
    >
      <span className="flex items-center justify-center">
        <Icon className="mr-1.5 h-4 w-4" /> {label}
      </span>
    </button>
  );
}
