'use client';

import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ 
  className, 
  variant = 'default', 
  size = 'md', 
  children, 
  style,
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    borderRadius: '8px',
    opacity: disabled ? 0.5 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
    ...style,
  };
  
  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: '#f5a623',
      color: '#0a0c10',
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#e8ecf4',
      border: '1px solid #2a3040',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#9aa4b8',
    },
    destructive: {
      backgroundColor: '#ef4444',
      color: 'white',
    },
  };
  
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '0.375rem 0.75rem', fontSize: '0.75rem' },
    md: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
    lg: { padding: '0.75rem 1.5rem', fontSize: '1rem' },
  };
  
  return (
    <button
      disabled={disabled}
      style={{ ...baseStyle, ...variantStyles[variant], ...sizeStyles[size] }}
      {...props}
    >
      {children}
    </button>
  );
}
