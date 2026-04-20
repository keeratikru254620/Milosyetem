import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { confirmService } from '../../services/confirmService';
import type { ConfirmState } from '../../types';

export default function ConfirmContainer() {
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  useEffect(() => {
    const unsubscribe = confirmService.subscribe((payload) => setConfirm(payload));
    return unsubscribe;
  }, []);

  if (!confirm) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="luxury-panel w-full max-w-sm overflow-hidden rounded-3xl border border-[var(--panel-border)] bg-[var(--app-surface-strong)] shadow-[var(--panel-shadow-strong)] transform scale-100 animate-in zoom-in-95 dark:border-slate-800 dark:bg-[var(--app-surface-strong)]">
        <div className="p-8 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(192,139,47,0.12)] dark:bg-amber-500/10">
            <AlertTriangle className="h-10 w-10 text-amber-500" />
          </div>
          <h3 className="luxury-heading mb-2 text-2xl font-bold text-slate-900 dark:text-white">
            {confirm.title}
          </h3>
          <p className="text-base leading-7 text-slate-600 dark:text-slate-400">{confirm.message}</p>
        </div>
        <div className="flex gap-3 border-t border-[var(--panel-border)] bg-[rgba(247,241,231,0.72)] px-6 py-5 dark:border-slate-800 dark:bg-slate-800/50">
          <button
            className="flex-1 rounded-xl border border-[var(--panel-border)] bg-white py-3.5 text-sm font-bold text-[var(--app-title)] shadow-sm transition hover:bg-[rgba(255,255,255,0.88)] active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            onClick={() => {
              confirm.resolve(false);
              setConfirm(null);
            }}
          >
            ยกเลิก
          </button>
          <button
            className="flex-1 rounded-xl border border-transparent bg-[linear-gradient(135deg,var(--app-navy),var(--app-navy-deep))] py-3.5 text-sm font-bold text-[var(--app-gold-soft)] shadow-md shadow-blue-900/20 transition hover:brightness-95 active:scale-95"
            onClick={() => {
              confirm.resolve(true);
              setConfirm(null);
            }}
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
}
