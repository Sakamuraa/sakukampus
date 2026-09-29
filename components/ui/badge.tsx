import { cn } from '@/lib/utils';

type Variant = 'default' | 'accent' | 'ok' | 'warn' | 'neutral';

const VARIANTS: Record<Variant, string> = {
  default: 'bg-surface-2 text-ink-dim border-line',
  accent: 'bg-accent-soft text-accent border-accent/30',
  ok: 'bg-ok-soft text-ok border-ok/30',
  warn: 'bg-warn-soft text-warn border-warn/30',
  neutral: 'bg-transparent text-ink-faint border-line',
};

/** Shape lock: badges are always full-pill. */
export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-[3px]',
        'text-[11px] font-semibold tracking-[0.01em] uppercase',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
