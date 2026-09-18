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
    <div className="relative">
      {/* Glow effect when focused */}
      <div
        className="absolute -inset-0.5 rounded-xl blur-md transition-opacity duration-300"
        style={{
          background: 'linear-gradient(135deg, rgba(245,166,35,0.3), rgba(251,146,60,0.1))',
          opacity: focused ? 1 : 0,
        }}
      />

      {/* Input container */}
      <div
        className="relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300"
        style={{
          background: 'var(--surface-2)',
          borderColor: focused ? 'var(--accent)' : 'var(--line)',
          boxShadow: focused ? '0 0 20px rgba(245,166,35,0.1)' : 'none',
        }}
      >
        {/* Icon */}
        <MagnifyingGlass
          size={20}
          weight="regular"
          style={{ color: focused ? 'var(--accent)' : 'var(--ink-faint)', transition: 'color 0.3s' }}
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
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: 'var(--ink)' }}
        />

        {/* Loading or clear button */}
        {isLoading ? (
          <div
            className="w-4 h-4 rounded-full border-2 animate-spin"
            style={{
              borderColor: 'var(--line)',
              borderTopColor: 'var(--accent)',
            }}
          />
        ) : value ? (
          <button
            onClick={() => onChange('')}
            className="p-0.5 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Clear"
          >
            <X size={14} weight="bold" style={{ color: 'var(--ink-faint)' }} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
