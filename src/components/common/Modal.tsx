import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ModalProps {
  children: ReactNode;
  footer?: ReactNode;
  icon?: LucideIcon;
  maxWidthClassName?: string;
  onClose: () => void;
  title: string;
}

export default function Modal({
  children,
  footer,
  icon: Icon,
  maxWidthClassName = 'max-w-lg',
  onClose,
  title,
}: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`luxury-panel w-full overflow-hidden rounded-[2rem] ${maxWidthClassName} transform animate-in zoom-in-95`}
      >
        <div className="metal-section-band flex items-center justify-between border-b border-white/10 px-6 py-5">
          <h3 className="flex items-center text-lg font-bold text-slate-900 dark:text-white">
            {Icon ? <Icon className="mr-2.5 h-5 w-5 text-[var(--app-gold)]" /> : null}
            {title}
          </h3>
          <button
            className="metal-icon-shell rounded-xl p-2 text-slate-400 transition hover:text-red-400 active:scale-95"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div>{children}</div>
        {footer ? (
          <div className="metal-section-band border-t border-white/10 px-6 py-5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
