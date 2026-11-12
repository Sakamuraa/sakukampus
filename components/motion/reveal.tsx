'use client';

import { Children, useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

/**
 * Scroll-entry reveal. Motivation: establishes reading order — the eye is led
 * down the page instead of the whole surface arriving at once.
 *
 * Isolated client leaf so the surrounding page stays a Server Component.
 *
 * WHY NO FRAMER-MOTION HERE
 * -------------------------
 * framer-motion reacts to `prefers-reduced-motion` by dropping the transform
 * from the inline style. The server cannot know that preference, so it always
 * renders WITH the transform: markup diverges, React throws a hydration
 * mismatch, and the page blanks out for exactly the visitors who asked for
 * less motion. (This was not hypothetical — it broke /cek, /data and /.)
 *
 * So the reveal is plain CSS driven by an IntersectionObserver:
 *   - server and first client render produce IDENTICAL markup
 *     (`data-reveal="pending"`), so hydration never mismatches
 *   - the observer flips it to `data-reveal="in"` once the element scrolls in
 *   - the CSS transition is neutralised by the `prefers-reduced-motion`
 *     media query already present in globals.css
 *   - `html[data-js]` guards the hidden state, so a visitor without JS sees
 *     the content instead of a blank page
 */

type RevealStyle = CSSProperties & { '--reveal-delay'?: string; '--reveal-y'?: string };

function useReveal<T extends HTMLElement>(delayMs: number) {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return {
    ref,
    style: { '--reveal-delay': `${delayMs}ms` } as RevealStyle,
    revealState: shown ? ('in' as const) : ('pending' as const),
  };
}

export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'tr' | 'article' | 'span';
}) {
  const { ref, style, revealState } = useReveal<HTMLDivElement>(delay * 1000);
  const Static = as as 'div';

  return (
    <Static
      ref={ref as never}
      className={className}
      style={{ ...style, '--reveal-y': `${y}px` } as RevealStyle}
      data-reveal={revealState}
    >
      {children}
    </Static>
  );
}

/** Grouped children arrive in sequence — hierarchy, not decoration. */
export function Stagger({
  children,
  className,
  gap = 0.07,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
  delay?: number;
}) {
  // Children.toArray flattens fragments and always yields an array, so the
  // server and the client agree on the number of items. A bare
  // `Array.isArray(children)` check did not: React hands the client a single
  // element where the server saw an array, and the two renders diverged.
  const list = Children.toArray(children);

  return (
    <div className={className}>
      {list.map((child, i) => (
        <Reveal key={i} delay={delay + i * gap} y={16}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}
