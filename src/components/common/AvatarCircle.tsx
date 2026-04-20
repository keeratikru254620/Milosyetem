interface AvatarCircleProps {
  name: string;
  src?: string;
  className?: string;
  textClassName?: string;
}

export default function AvatarCircle({
  name,
  src,
  className = '',
  textClassName = '',
}: AvatarCircleProps) {
  const combinedClassName = [
    'flex items-center justify-center overflow-hidden rounded-full border border-white/70 bg-[linear-gradient(135deg,var(--app-navy),var(--app-navy-deep))] font-bold text-[var(--app-gold-soft)] shadow-[0_14px_30px_rgba(15,23,42,0.18)]',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={combinedClassName}>
      {src ? (
        <img alt={name} className="h-full w-full object-cover" src={src} />
      ) : (
        <span className={textClassName}>{name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}
