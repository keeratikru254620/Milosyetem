import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { toastService } from '../../services/toastService';
import type { ToastPayload } from '../../types';

export default function ToastContainer() {
  const [toast, setToast] = useState<ToastPayload | null>(null);

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const unsubscribe = toastService.subscribe((payload) => {
      setToast(payload);

      if (timerId) {
        clearTimeout(timerId);
      }

      timerId = setTimeout(() => setToast(null), 3000);
    });

    return () => {
      unsubscribe();

      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, []);

  if (!toast) {
    return null;
  }

  const styles =
    toast.type === 'error'
      ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-900/50 dark:text-red-200'
      : toast.type === 'info'
        ? 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-900/50 dark:text-blue-200'
        : 'bg-slate-900 border-slate-800 text-amber-400 dark:bg-white dark:border-slate-200 dark:text-slate-900';

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-slide-blur">
      <div className={`flex items-center rounded-2xl border px-6 py-5 shadow-2xl ${styles}`}>
        {toast.type === 'error' ? (
          <XCircle className="mr-3 h-6 w-6 text-red-500" />
        ) : toast.type === 'info' ? (
          <Info className="mr-3 h-6 w-6 text-blue-600" />
        ) : (
          <CheckCircle2 className="mr-3 h-6 w-6 text-amber-500" />
        )}
        <p className="text-base font-bold">{toast.message}</p>
      </div>
    </div>
  );
}
