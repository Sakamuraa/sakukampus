import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  /* One accent, locked across the whole product. */
  primary:
    'bg-accent text-[#14100a] hover:bg-[#ffb739] shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_6px_20px_-8px_rgba(245,166,35,0.6)]',
  secondary:
    'bg-surface-2 text-ink border border-line hover:border-line-strong hover:bg-surface-3',
  ghost: 'text-ink-dim hover:text-ink hover:bg-surface-2',
  danger: 'bg-[#3a1518] text-[#ff8f8f] border border-[#5c2226] hover:bg-[#4a1a1e]',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-[15px] gap-2',
};

/** Shape lock: every control uses radius-ctl (10px). */
export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={cn(
        'press inline-flex shrink-0 items-center justify-center rounded-ctl font-semibold',
        'whitespace-nowrap cursor-pointer select-none',
        'disabled:pointer-events-none disabled:opacity-45',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}
