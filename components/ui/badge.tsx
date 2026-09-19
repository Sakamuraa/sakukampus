import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const variantStyles: Record<string, string> = {
  default: 'border-transparent bg-[var(--accent)] text-[#0a0c10]',
  secondary: 'border-transparent bg-[var(--surface-2)] text-[var(--ink)]',
  destructive: 'border-transparent bg-red-500 text-white',
  outline: 'text-[var(--ink)]',
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
