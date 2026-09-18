interface BadgePillProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export function BadgePill({ children, variant = 'default', className = '' }: BadgePillProps) {
  const colors = {
    default: {
      bg: 'var(--surface-2)',
      border: 'var(--line)',
      text: 'var(--ink-dim)',
    },
    success: {
      bg: 'rgba(52, 211, 153, 0.1)',
      border: 'rgba(52, 211, 153, 0.3)',
      text: 'var(--ok)',
    },
    warning: {
      bg: 'rgba(251, 146, 60, 0.1)',
      border: 'rgba(251, 146, 60, 0.3)',
      text: 'var(--warn)',
    },
    error: {
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.3)',
      text: '#ef4444',
    },
  };

  const c = colors[variant];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{
        background: c.bg,
        border: `1px solid c.border`,
        color: c.text,
      }}
    >
      {children}
    </span>
  );
}
