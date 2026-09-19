import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = ({ className, ...props }: CardProps) => (
  <div
    className={cn(
      'rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-sm',
      className
    )}
    {...props}
  />
);

const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-6 pt-6 pb-4', className)} {...props} />
);

const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('font-semibold leading-none tracking-tight', className)} {...props} />
);

const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-sm text-[var(--ink-faint)]', className)} {...props} />
);

const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-6 py-4', className)} {...props} />
);

const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center px-6 pb-6', className)} {...props} />
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
