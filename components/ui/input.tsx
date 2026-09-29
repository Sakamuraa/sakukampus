import { cn } from '@/lib/utils';

/** Label ABOVE input. Never placeholder-as-label. */
export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid gap-2', className)}>
      <label
        htmlFor={htmlFor}
        className="text-[13px] font-medium text-ink-dim"
      >
        {label}
      </label>
      {children}
      {hint && <p className="text-[12px] text-ink-faint">{hint}</p>}
    </div>
  );
}

/** Shape lock: inputs use radius-ctl (10px), same as buttons. */
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'press h-11 w-full rounded-ctl border border-line bg-surface-2 px-3.5',
        'text-[15px] text-ink placeholder:text-ink-faint',
        'focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/25',
        'disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'press h-11 w-full rounded-ctl border border-line bg-surface-2 px-3.5',
        'text-[15px] text-ink cursor-pointer',
        'focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/25',
        className,
      )}
      {...props}
    />
  );
}
