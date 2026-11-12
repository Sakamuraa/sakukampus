'use client';

import { useCallback, useEffect, useState } from 'react';
import { MoonStars } from '@phosphor-icons/react/dist/csr/MoonStars';
import { Sun } from '@phosphor-icons/react/dist/csr/Sun';
import { cn } from '@/lib/utils';

export const THEME_KEY = 'sk-theme';
export type Theme = 'light' | 'dark';

/** Runs before paint, inlined in <body>, so the first frame already has the right palette. */
export const THEME_INIT_SCRIPT = `(function(){try{var k='${THEME_KEY}';var s=localStorage.getItem(k);var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=d?'dark':'light';}catch(e){}})();`;

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* Private mode with storage disabled: the toggle still works for this tab. */
  }
}

/**
 * Theme state is read from the DOM, never from a server prop, so the
 * markup the server sends and the markup the client hydrates agree.
 * `mounted` only guards the icon swap.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      apply(next);
      return next;
    });
  }, []);

  return { theme, mounted, toggle };
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, mounted, toggle } = useTheme();
  const dark = mounted && theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
      aria-pressed={dark}
      title={dark ? 'Mode terang' : 'Mode gelap'}
      className={cn(
        'press inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-ctl',
        'border border-line-strong text-ink-dim hover:border-ink hover:bg-surface-2 hover:text-ink',
        className,
      )}
    >
      {dark ? <Sun size={17} weight="bold" aria-hidden="true" /> : <MoonStars size={17} weight="bold" aria-hidden="true" />}
    </button>
  );
}

/** Bottom tab bar cell — same shape as a nav item so the row stays even. */
export function ThemeTab() {
  const { theme, mounted, toggle } = useTheme();
  const dark = mounted && theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
      aria-pressed={dark}
      className="press flex h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium text-ink-faint"
    >
      {dark ? <Sun size={19} weight="bold" aria-hidden="true" /> : <MoonStars size={19} weight="regular" aria-hidden="true" />}
      Tema
    </button>
  );
}
