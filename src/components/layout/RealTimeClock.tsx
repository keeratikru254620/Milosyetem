import { useEffect, useState } from 'react';

export default function RealTimeClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mr-1 hidden flex-col items-end border-r border-white/12 pr-5 md:flex">
      <span className="font-display text-sm font-semibold tracking-[0.12em] text-slate-800 dark:text-white">
        {time.toLocaleTimeString('th-TH', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </span>
      <span className="luxury-kicker text-[10px]">
        {time.toLocaleDateString('th-TH', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </span>
    </div>
  );
}
