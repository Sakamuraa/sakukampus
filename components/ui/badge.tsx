import { cn } from '@/lib/utils';

type Variant = 'default' | 'accent' | 'ok' | 'warn' | 'neutral';

const VARIANTS: Record<Variant, string> = {
  default: 'bg-surface-2 text-ink-dim border-line-strong',
  accent: 'bg-accent-soft text-accent border-accent/25',
  ok: 'bg-ok-soft text-ok border-ok/25',
  warn: 'bg-warn-soft text-warn border-warn/25',
  neutral: 'bg-transparent text-ink-faint border-line-strong',
};

/**
 * Shape lock: tags are square-ish (4px), never pills — they read as
 * stamps pressed onto the page rather than chat bubbles.
 */
export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-[4px] border px-2 py-[3px]',
        'text-[10.5px] font-semibold tracking-[0.07em] uppercase',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
