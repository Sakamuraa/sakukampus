'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { APP_VERSION, CHANGELOG } from '@/lib/changelog';
import { Button } from '@/components/ui/button';

const EASE = [0.22, 1, 0.36, 1] as const;

/* sessionStorage, bukan localStorage: popup ini milik satu sesi peramban.
   Buka tab baru, muncul lagi; pindah halaman di tab yang sama, tidak. */
const SEEN_KEY = 'sk-whats-new';

function alreadySeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === APP_VERSION;
  } catch {
    // Mode privat atau storage dimatikan: jangan sampai popup gagal render.
    return false;
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, APP_VERSION);
  } catch {
    /* diabaikan dengan sengaja */
  }
}

export default function WhatsNew() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Dibaca setelah mount supaya markup server dan klien identik (tanpa flash).
  // Ditandai begitu tampil, bukan saat ditutup: yang diminta adalah "sekali per
  // sesi", jadi reload tanpa menutup pun tidak memunculkannya lagi.
  useEffect(() => {
    if (alreadySeen()) return;
    markSeen();
    setOpen(true);
  }, []);

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-[#17140f]/45 backdrop-blur-[3px]" onClick={close} />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="whats-new-title"
            className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-card border border-line-strong bg-surface shadow-float sm:max-h-[85dvh] sm:max-w-lg sm:rounded-card"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <p className="font-mono text-[11px] font-medium tracking-[0.16em] text-accent uppercase">
                  Changelog
                </p>
                <h2
                  id="whats-new-title"
                  className="mt-1 font-display text-[19px] leading-tight font-semibold tracking-[-0.02em] text-ink"
                >
                  Pencarian beasiswa otomatis
                </h2>
                <p className="mt-1.5 flex items-center gap-2 text-[12.5px] text-ink-faint">
                  <span className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink-dim">
                    v{APP_VERSION}
                  </span>
                  <span>Rilis 21 November 2026</span>
                </p>
              </div>
              <button
                ref={closeRef}
                onClick={close}
                aria-label="Tutup"
                className="press grid h-8 w-8 shrink-0 place-items-center rounded-ctl border border-line text-ink-faint hover:border-line-strong hover:text-ink"
              >
                <X size={15} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <ul className="grid gap-3.5">
                {CHANGELOG.map((entry) => (
                  <li key={entry.label} className="grid gap-1">
                    <span className="font-mono text-[11px] tracking-[0.06em] text-accent uppercase">
                      {entry.label}
                    </span>
                    <span className="text-[13.5px] leading-relaxed text-ink-dim">{entry.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <footer className="shrink-0 border-t border-line px-5 py-4">
              <Button onClick={close} className="w-full">
                Mengerti
              </Button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
