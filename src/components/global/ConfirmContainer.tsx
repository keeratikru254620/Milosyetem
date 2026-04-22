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
      <div className="luxury-panel w-full max-w-sm overflow-hidden rounded-3xl bg-[var(--app-surface-strong)] shadow-[var(--panel-shadow-strong)] transform scale-100 animate-in zoom-in-95">
        <div className="p-8 text-center">
          <div className="metal-icon-shell animate-ember-pulse mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full">
            <AlertTriangle className="h-10 w-10 text-[var(--app-gold)]" />
          </div>
          <h3 className="luxury-heading mb-2 text-2xl font-bold text-slate-900 dark:text-white">
            {confirm.title}
          </h3>
          <p className="text-base leading-7 text-slate-600 dark:text-slate-400">{confirm.message}</p>
        </div>
        <div className="metal-section-band flex gap-3 border-t border-white/10 px-6 py-5">
          <button
            className="metal-button-secondary flex-1 rounded-xl py-3.5 text-sm font-bold transition active:scale-95"
            onClick={() => {
              confirm.resolve(false);
              setConfirm(null);
            }}
          >
            ยกเลิก
          </button>
          <button
            className="metal-button-primary flex-1 rounded-xl py-3.5 text-sm font-bold transition hover:brightness-105 active:scale-95"
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
