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
        className={`w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.25)] dark:border-slate-800 dark:bg-slate-900 ${maxWidthClassName} transform animate-in zoom-in-95`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-5 dark:border-slate-800 dark:bg-slate-800/30">
          <h3 className="flex items-center text-lg font-bold text-slate-900 dark:text-white">
            {Icon ? <Icon className="mr-2.5 h-5 w-5 text-blue-900 dark:text-amber-500" /> : null}
            {title}
          </h3>
          <button
            className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500 active:scale-95 dark:hover:bg-red-500/10"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div>{children}</div>
        {footer ? (
          <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-5 dark:border-slate-800 dark:bg-slate-800/30">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
