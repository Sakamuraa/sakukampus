'use client';

import type { ButtonHTMLAttributes, ForwardRefExoticComponent, RefAttributes } from 'react';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const baseStyles = `
  inline-flex items-center justify-center gap-2 
  font-medium transition-all duration-200 
  rounded-md focus-visible:outline-none 
  focus-visible:ring-2 focus-visible:ring-offset-2 
  disabled:pointer-events-none disabled:opacity-50
`;

const variantStyles: Record<string, string> = {
  default: 'bg-[var(--accent)] text-[#0a0c10] hover:brightness-110 shadow-sm',
  outline: 'border border-[var(--line)] bg-transparent hover:bg-[var(--surface-2)] hover:text-[var(--accent)]',
  ghost: 'hover:bg-[var(--surface-2)] hover:text-[var(--accent)]',
  destructive: 'bg-red-500 text-white hover:bg-red-600',
  link: 'text-[var(--accent)] underline-offset-4 hover:underline',
};

const sizeStyles: Record<string, string> = {
  default: 'h-10 px-4 py-2 text-sm',
  sm: 'h-9 px-3 text-xs',
  lg: 'h-11 px-8 text-base',
  icon: 'h-10 w-10',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
