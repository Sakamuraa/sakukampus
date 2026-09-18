'use client';

import { useState } from 'react';
import { MagnifyingGlass, X } from '@phosphor-icons/react';

interface AnimatedSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export function AnimatedSearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  isLoading = false,
}: AnimatedSearchInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      {/* Glow effect when focused */}
      <div
        style={{
          position: 'absolute',
          inset: -2,
          borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(245,166,35,0.3), rgba(251,146,60,0.1))',
          filter: 'blur(8px)',
          opacity: focused ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Input container */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          borderRadius: 12,
          border: `1px solid ${focused ? 'var(--accent)' : 'var(--line)'}`,
          background: 'var(--surface-2)',
          boxShadow: focused ? '0 0 24px rgba(245,166,35,0.15)' : 'none',
          transition: 'all 0.3s ease',
          zIndex: 1,
        }}
      >
        {/* Icon */}
        <MagnifyingGlass
          size={20}
          weight="regular"
          style={{ color: focused ? 'var(--accent)' : 'var(--ink-faint)', transition: 'color 0.3s', flexShrink: 0 }}
          aria-hidden="true"
        />

        {/* Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: 'transparent',
            outline: 'none',
            border: 'none',
            fontSize: 14,
            color: 'var(--ink)',
          }}
        />

        {/* Loading or clear button */}
        {isLoading ? (
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              border: '2px solid var(--line)',
              borderTopColor: 'var(--accent)',
              animation: 'spin 1s linear infinite',
            }}
          />
        ) : value ? (
          <button
            onClick={() => onChange('')}
            style={{
              padding: 2,
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            aria-label="Clear"
          >
            <X size={14} weight="bold" style={{ color: 'var(--ink-faint)' }} />
          </button>
        ) : null}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
