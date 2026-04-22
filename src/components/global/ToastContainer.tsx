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
      ? 'bg-[linear-gradient(180deg,rgba(255,240,238,0.18),rgba(255,255,255,0.02)_28%),linear-gradient(135deg,rgba(126,62,72,0.86),rgba(86,41,47,0.92))] border-[rgba(255,200,188,0.18)] text-[#fff1ed]'
      : toast.type === 'info'
        ? 'bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.02)_28%),linear-gradient(135deg,rgba(117,126,138,0.88),rgba(75,84,96,0.94))] border-white/14 text-[var(--app-title)] dark:text-white'
        : 'bg-[linear-gradient(180deg,rgba(255,238,219,0.18),rgba(255,255,255,0.02)_28%),linear-gradient(135deg,rgba(136,92,53,0.88),rgba(93,63,42,0.94))] border-[rgba(255,212,163,0.18)] text-[#fff7ef]';

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-slide-blur">
      <div className={`flex items-center rounded-[1.5rem] border px-6 py-5 shadow-[var(--panel-shadow-strong)] backdrop-blur-xl ${styles}`}>
        {toast.type === 'error' ? (
          <XCircle className="mr-3 h-6 w-6 text-[#ffc1b3]" />
        ) : toast.type === 'info' ? (
          <Info className="mr-3 h-6 w-6 text-[var(--app-gold-soft)]" />
        ) : (
          <CheckCircle2 className="mr-3 h-6 w-6 text-[var(--app-gold-soft)]" />
        )}
        <p className="text-base font-semibold">{toast.message}</p>
      </div>
    </div>
  );
}
