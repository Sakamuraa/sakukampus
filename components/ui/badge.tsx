import { cn } from '@/lib/utils';

function Badge({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & { variant?: 'default' | 'secondary' | 'outline' }) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variant === 'default' && 'border-transparent bg-[#f5a623] text-[#0a0c10]',
        variant === 'secondary' && 'border-transparent bg-[#1a1e27] text-[#e8ecf4]',
        variant === 'outline' && 'border-[#2a3040] text-[#9aa4b8]',
        className
      )}
      {...props}
    />
  );
}

export { Badge };
