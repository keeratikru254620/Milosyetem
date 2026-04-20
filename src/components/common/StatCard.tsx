import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  backgroundClassName: string;
  icon: LucideIcon;
  iconClassName: string;
  label: string;
  value: number;
}

export default function StatCard({
  backgroundClassName,
  icon: Icon,
  iconClassName,
  label,
  value,
}: StatCardProps) {
  return (
    <div className="luxury-panel group relative overflow-hidden rounded-[1.75rem] p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--panel-shadow-strong)] dark:border-slate-800 dark:bg-[rgba(15,24,42,0.92)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[var(--app-gold)] to-transparent opacity-70" />
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[rgba(192,139,47,0.14)] blur-2xl dark:bg-[rgba(224,177,91,0.08)]" />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="luxury-kicker mb-2 text-[11px] dark:text-[var(--app-gold-soft)]">
            {label}
          </p>
          <h3 className="text-4xl font-bold tracking-tight text-[var(--app-title)] dark:text-white">
            {value}
          </h3>
        </div>
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3 ${backgroundClassName}`}
        >
          <Icon className={`h-7 w-7 ${iconClassName}`} />
        </div>
      </div>
    </div>
  );
}
