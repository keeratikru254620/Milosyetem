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
    <div className="luxury-panel group relative overflow-hidden rounded-[1.75rem] p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--panel-shadow-strong)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-75" />
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[var(--app-ember-soft)] blur-2xl" />
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
          className={`metal-icon-shell flex h-16 w-16 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3 ${backgroundClassName}`}
        >
          <Icon className={`h-7 w-7 ${iconClassName}`} />
        </div>
      </div>
    </div>
  );
}
