interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function GlassCard({ children, className = '', accent = false, onClick }: GlassCardProps) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border
        backdrop-blur-sm
        transition-all duration-300
        ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}
        ${className}
      `}
      style={{
        background: accent
          ? 'linear-gradient(135deg, rgba(245,166,35,0.08) 0%, rgba(245,166,35,0.02) 100%)'
          : 'var(--surface)',
        borderColor: accent ? 'rgba(245,166,35,0.2)' : 'var(--line)',
        boxShadow: accent
          ? '0 0 30px rgba(245,166,35,0.05), inset 0 1px 0 rgba(255,255,255,0.05)'
          : '0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {/* Subtle gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%)',
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
