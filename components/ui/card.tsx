import { cn } from '@/lib/utils';

/** Shape lock: cards are always 16px. */
export function Card({
  className,
  interactive = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-card border border-line bg-surface',
        interactive &&
          'press cursor-pointer hover:border-line-strong hover:bg-surface-2 hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.9)]',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pt-5 pb-3 sm:px-6', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-[15px] font-semibold tracking-[-0.01em] text-ink', className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-1 text-[13px] text-ink-faint', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pb-5 sm:px-6', className)} {...props} />;
}
