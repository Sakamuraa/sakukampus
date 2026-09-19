import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className
      )}
      {...props}
    />
  );
}
