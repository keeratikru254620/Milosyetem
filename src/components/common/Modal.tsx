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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-3 py-6 backdrop-blur-md animate-in fade-in duration-200 sm:items-center sm:p-4">
      <div
        className={`luxury-panel max-h-[calc(100dvh-3rem)] w-full overflow-hidden rounded-3xl sm:rounded-[2rem] ${maxWidthClassName} transform animate-in zoom-in-95`}
      >
        <div className="metal-section-band flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
          <h3 className="flex min-w-0 items-center text-base font-bold text-slate-900 dark:text-white sm:text-lg">
            {Icon ? <Icon className="mr-2.5 h-5 w-5 text-[var(--app-gold)]" /> : null}
            <span className="truncate">{title}</span>
          </h3>
          <button
            className="metal-icon-shell rounded-xl p-2 text-slate-400 transition hover:text-red-400 active:scale-95"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(100dvh-9rem)] overflow-y-auto">{children}</div>
        {footer ? (
          <div className="metal-section-band border-t border-white/10 px-6 py-5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
