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
      ? 'bg-[rgba(255,245,245,0.96)] border-red-200 text-red-800 dark:bg-red-950 dark:border-red-900/50 dark:text-red-200'
      : toast.type === 'info'
        ? 'bg-[rgba(242,247,255,0.96)] border-blue-200 text-[var(--app-navy)] dark:bg-blue-950 dark:border-blue-900/50 dark:text-blue-200'
        : 'bg-[rgba(255,250,242,0.98)] border-[rgba(192,139,47,0.2)] text-[var(--app-title)] dark:bg-[rgba(20,30,50,0.96)] dark:border-[rgba(224,177,91,0.22)] dark:text-[var(--app-gold-soft)]';

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-slide-blur">
      <div className={`flex items-center rounded-[1.5rem] border px-6 py-5 shadow-[var(--panel-shadow-strong)] backdrop-blur-xl ${styles}`}>
        {toast.type === 'error' ? (
          <XCircle className="mr-3 h-6 w-6 text-red-500" />
        ) : toast.type === 'info' ? (
          <Info className="mr-3 h-6 w-6 text-blue-600" />
        ) : (
          <CheckCircle2 className="mr-3 h-6 w-6 text-amber-500" />
        )}
        <p className="text-base font-semibold">{toast.message}</p>
      </div>
    </div>
  );
}
