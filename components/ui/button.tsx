import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  /* One accent, locked across the whole product: teal on paper. */
  primary:
    'bg-accent text-accent-ink hover:bg-[#0a4a51] shadow-[0_1px_0_rgba(255,255,255,0.14)_inset]',
  secondary:
    'bg-surface text-ink border border-line-strong hover:border-ink hover:bg-surface-2',
  ghost: 'text-ink-dim hover:text-ink hover:bg-surface-2',
  danger: 'bg-[#8f2d28] text-white border border-[#7a2622] hover:bg-[#7a2622]',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-[15px] gap-2',
};

/** Shape lock: every control uses radius-ctl (8px). */
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
