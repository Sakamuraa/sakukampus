'use client';

import { useRef, useEffect, useState } from 'react';

interface ShimmerButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
}

export function ShimmerButton({
  children,
  className = '',
  onClick,
  disabled,
  type = 'button',
  style,
}: ShimmerButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setMousePosition({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    };

    if (isHovered && buttonRef.current) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isHovered]);

  return (
    <button
      ref={buttonRef}
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 9999,
        padding: '12px 32px',
        fontWeight: 600,
        fontSize: 14,
        color: isHovered && !disabled ? '#fff' : 'var(--accent-ink)',
        background: disabled
          ? 'var(--surface-2)'
          : isHovered
            ? `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,255,255,0.2) 0%, transparent 60%), var(--accent)`
            : 'var(--accent)',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        transform: isHovered && !disabled ? 'translateY(-2px)' : 'none',
        boxShadow: isHovered && !disabled ? '0 8px 24px rgba(245,166,35,0.3)' : 'none',
        ...style,
      }}
    >
      {/* Shimmer effect */}
      <span
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          backgroundSize: '200% 100%',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.5s ease',
          animation: isHovered ? 'shimmer 2s infinite' : 'none',
          pointerEvents: 'none',
        }}
      />
      <span className="relative z-10 flex items-center gap-2" style={{ position: 'relative', zIndex: 1 }}>{children}</span>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </button>
  );
}
