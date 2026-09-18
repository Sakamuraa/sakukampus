'use client';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function GlassCard({ children, className = '', accent = false, onClick, style }: GlassCardProps) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 12,
        border: `1px solid ${accent ? 'rgba(245,166,35,0.2)' : 'var(--line)'}`,
        background: accent
          ? 'linear-gradient(135deg, rgba(245,166,35,0.08) 0%, rgba(245,166,35,0.02) 100%)'
          : 'var(--surface)',
        boxShadow: accent
          ? '0 0 30px rgba(245,166,35,0.05), inset 0 1px 0 rgba(255,255,255,0.05)'
          : '0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(8px)',
        ...style,
      }}
    >
      {/* Subtle gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%)',
          pointerEvents: 'none',
          opacity: 0.5,
        }}
      />
      <div className="relative z-10" style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}
