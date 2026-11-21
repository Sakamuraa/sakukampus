'use client';

import { useEffect, useRef } from 'react';

/**
 * Karakter pendamping halaman dokumentasi.
 *
 * Gambarnya dipotong jadi dua lapis — kepala dan badan — supaya bisa
 * dianimasikan terpisah: kepala mengangguk dan sedikit menoleh mengikuti
 * scroll, badan menyusul lebih lambat. Keduanya juga punya napas idle
 * yang sangat halus supaya karakternya tidak terasa seperti stiker mati.
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

// Geometri lapisan. rem-head.png 560x429, rem-body.png 560x594, disusun
// dalam kanvas 560x991. Badan sengaja mulai 32px di atas potongan leher
// supaya kepala yang berputar sedikit tidak pernah membuka celah.
const FRAME_W = 560;
const FRAME_H = 991;
const HEAD_H = 429;
const BODY_TOP = 397;
const NECK_X = 293;
const NECK_Y = 429;

export default function Karakter({
  headSrc,
  bodySrc,
  alt,
  caption,
}: {
  headSrc: string;
  bodySrc: string;
  alt: string;
  caption: string;
}) {
  const figureRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const figure = figureRef.current;
    const head = headRef.current;
    const body = bodyRef.current;
    if (!figure || !head || !body) return;

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

      body.style.transform = `translate3d(0, ${(progress * -20).toFixed(2)}px, 0)`;
      // Kepala bergerak lebih jauh dan ikut berputar sedikit, jadi terasa
      // seperti menoleh ke arah pembaca saat halaman digulir.
      head.style.transform =
        `translate3d(0, ${(progress * -32).toFixed(2)}px, 0) ` +
        `rotate(${(progress * 3).toFixed(2)}deg)`;
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
        <div className="relative w-full" style={{ aspectRatio: `${FRAME_W} / ${FRAME_H}` }}>
          {/* halo kertas di belakang karakter */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[64%] bg-[radial-gradient(ellipse_at_50%_40%,var(--color-accent-soft),transparent_70%)]"
          />

          <div
            ref={bodyRef}
            className="absolute inset-x-0 will-change-transform"
            style={{ top: `${(BODY_TOP / FRAME_H) * 100}%` }}
          >
            <div className="rem-breathe">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bodySrc}
                alt=""
                aria-hidden
                width={FRAME_W}
                height={594}
                className="block h-auto w-full"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          <div
            ref={headRef}
            className="absolute inset-x-0 top-0 will-change-transform"
            style={{
              transformOrigin: `${(NECK_X / FRAME_W) * 100}% ${(NECK_Y / HEAD_H) * 100}%`,
            }}
          >
            <div className="rem-bob">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={headSrc}
                alt={alt}
                width={FRAME_W}
                height={HEAD_H}
                className="block h-auto w-full"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>

        <figcaption className="border-t border-line-strong bg-surface px-5 py-3.5">
          <span className="font-display text-[13.5px] italic text-ink-dim">{caption}</span>
        </figcaption>
      </div>
    </figure>
  );
}
