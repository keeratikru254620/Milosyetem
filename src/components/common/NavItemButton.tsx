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
      className="metal-button-secondary flex-1 rounded-xl py-2.5 text-xs font-bold transition active:scale-95"
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
