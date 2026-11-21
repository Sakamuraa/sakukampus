'use client';

import { useEffect, useRef } from 'react';

/**
 * Karakter pendamping halaman dokumentasi.
 *
 * Animasi scroll-nya sengaja tidak memakai framer-motion, mengikuti alasan
 * yang sama seperti components/motion/reveal.tsx: cabang `prefers-reduced-motion`
 * di framer-motion hanya berjalan di klien, markup server dan klien jadi beda,
 * dan React melempar hydration mismatch.
 *
 * Di sini markup server dan render pertama klien identik. Pergeseran parallax
 * ditulis lewat ref setelah mount, jadi tidak pernah ikut ke HTML. Animasi
 * masuknya sendiri diserahkan ke <Reveal> di halaman induk.
 */
export default function Karakter({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption: string;
}) {
  const figureRef = useRef<HTMLElement>(null);
  const artRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const figure = figureRef.current;
    const art = artRef.current;
    if (!figure || !art) return;

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    // Pergeseran halus mengikuti posisi elemen di layar. Ditulis langsung ke
    // style lewat ref, bukan state, supaya tidak memicu render ulang per frame.
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = figure.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // -1 saat elemen masih di bawah layar, +1 saat sudah lewat atas.
      const progress = Math.max(-1, Math.min(1, (rect.top + rect.height / 2 - vh / 2) / vh));
      art.style.transform = `translate3d(0, ${(progress * -26).toFixed(2)}px, 0)`;
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <figure ref={figureRef} className="relative m-0">
      <div
        aria-hidden
        className="absolute -right-3 -top-3 h-full w-full rounded-card border border-line"
      />
      <div className="relative overflow-hidden rounded-card border border-line-strong bg-surface-2">
        <div ref={artRef} className="will-change-transform">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            width={480}
            height={640}
            className="block h-auto w-full"
            loading="lazy"
            decoding="async"
          />
        </div>
        <figcaption className="border-t border-line-strong bg-surface px-5 py-3.5">
          <span className="font-display text-[13.5px] italic text-ink-dim">{caption}</span>
        </figcaption>
      </div>
    </figure>
  );
}
