import { useEffect, useState } from 'react';

export default function RealTimeClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mr-1 hidden flex-col items-end border-r border-[rgba(192,139,47,0.18)] pr-5 md:flex dark:border-slate-700">
      <span className="text-sm font-semibold tracking-[0.08em] text-slate-800 dark:text-white">
        {time.toLocaleTimeString('th-TH', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--app-gold)] dark:text-[var(--app-gold-soft)]">
        {time.toLocaleDateString('th-TH', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </span>
    </div>
  );
}
