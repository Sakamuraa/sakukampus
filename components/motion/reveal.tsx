'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Scroll-entry reveal. Motivation: establishes reading order — the eye is led
 * down the page instead of the whole surface arriving at once.
 *
 * Isolated client leaf so the surrounding page stays a Server Component.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

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
  const reduce = useReducedMotion();
  const Tag = motion[as] as typeof motion.div;

  if (reduce) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: EASE }}
    >
      {children}
    </Tag>
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
  const reduce = useReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: gap, delayChildren: delay } },
      }}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
              }}
            >
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
}
