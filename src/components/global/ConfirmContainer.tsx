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
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 transform scale-100 animate-in zoom-in-95">
        <div className="p-8 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-500/10">
            <AlertTriangle className="h-10 w-10 text-amber-500" />
          </div>
          <h3 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
            {confirm.title}
          </h3>
          <p className="text-base text-slate-500 dark:text-slate-400">{confirm.message}</p>
        </div>
        <div className="flex gap-3 border-t border-slate-100 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-800/50">
          <button
            className="flex-1 rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            onClick={() => {
              confirm.resolve(false);
              setConfirm(null);
            }}
          >
            ยกเลิก
          </button>
          <button
            className="flex-1 rounded-xl border border-blue-800 bg-blue-900 py-3.5 text-sm font-bold text-amber-400 shadow-md shadow-blue-900/20 transition hover:bg-blue-950 active:scale-95"
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
