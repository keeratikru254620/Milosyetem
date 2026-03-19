import { useEffect, useState } from 'react';

export default function RealTimeClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mr-1 hidden flex-col items-end border-r border-slate-200 pr-5 md:flex dark:border-slate-700">
      <span className="font-mono text-sm font-bold tracking-wide text-slate-800 dark:text-white">
        {time.toLocaleTimeString('th-TH', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {time.toLocaleDateString('th-TH', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </span>
    </div>
  );
}
