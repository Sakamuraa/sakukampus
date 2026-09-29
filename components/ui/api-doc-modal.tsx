'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Copy } from '@phosphor-icons/react/dist/csr/Copy';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { API_DOCS, type ApiDoc } from '@/components/ui/api-docs';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;

export default function ApiDocModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<ApiDoc>(API_DOCS[0]);
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const [picker, setPicker] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const m = selected.methods[active];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Dokumentasi API"
          className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.9)] sm:max-h-[85dvh] sm:max-w-3xl sm:rounded-2xl"
          initial={{ y: 40, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 24, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3, ease: EASE }}
        >
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-ink">Dokumentasi API</p>
              <p className="truncate text-[12.5px] text-ink-faint">
                Publik, tanpa kunci, terbuka untuk siapa saja
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Tutup"
              className="press grid h-8 w-8 shrink-0 place-items-center rounded-ctl border border-line text-ink-faint hover:border-line-strong hover:text-ink"
            >
              <X size={15} />
            </button>
          </header>

          <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
            {/* Endpoint picker — accordion on mobile, rail on desktop */}
            <div className="shrink-0 border-b border-line sm:w-[220px] sm:border-r sm:border-b-0">
              <div className="hidden sm:block">
                {API_DOCS.map((d) => (
                  <button
                    key={d.path}
                    onClick={() => {
                      setSelected(d);
                      setActive(0);
                    }}
                    className={cn(
                      'press block w-full border-l-2 px-4 py-3.5 text-left',
                      selected.path === d.path
                        ? 'border-accent bg-accent/8'
                        : 'border-transparent hover:bg-surface-2',
                    )}
                  >
                    <span
                      className={cn(
                        'block font-mono text-[11px]',
                        selected.path === d.path ? 'text-accent' : 'text-ink-faint',
                      )}
                    >
                      {d.path}
                    </span>
                    <span
                      className={cn(
                        'mt-0.5 block text-[13px] font-medium',
                        selected.path === d.path ? 'text-ink' : 'text-ink-dim',
                      )}
                    >
                      {d.title}
                    </span>
                  </button>
                ))}
              </div>

              <div className="sm:hidden">
                <button
                  onClick={() => setPicker((v) => !v)}
                  className="press flex w-full items-center justify-between px-5 py-3.5 text-left"
                >
                  <span className="font-mono text-[12.5px] text-accent">{selected.path}</span>
                  <span className="text-[12px] text-ink-faint">{picker ? 'Tutup' : 'Ganti'}</span>
                </button>
                {picker && (
                  <div className="border-t border-line">
                    {API_DOCS.map((d) => (
                      <button
                        key={d.path}
                        onClick={() => {
                          setSelected(d);
                          setActive(0);
                          setPicker(false);
                        }}
                        className="press block w-full border-b border-line px-5 py-3 text-left text-[13.5px] text-ink-dim last:border-b-0"
                      >
                        <span className="font-mono text-[11px] text-ink-faint">{d.path}</span>
                        <span className="block">{d.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Detail */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <p className="text-[13.5px] leading-relaxed text-ink-dim">{selected.description}</p>

              <div className="mt-4 grid gap-3">
                {selected.methods.map((meth, i) => {
                  const open = active === i;
                  return (
                    <div key={i}>
                      <button
                        onClick={() => setActive(open ? -1 : i)}
                        className={cn(
                          'press flex w-full items-center gap-3 rounded-ctl border px-3.5 py-3 text-left',
                          open
                            ? 'border-accent/40 bg-accent/8'
                            : 'border-line bg-surface-2 hover:border-line-strong',
                        )}
                      >
                        <span
                          className={cn(
                            'rounded-md px-2 py-0.5 font-mono text-[11px] font-bold',
                            meth.method === 'POST'
                              ? 'bg-ok-soft text-ok'
                              : 'bg-accent-soft text-accent',
                          )}
                        >
                          {meth.method}
                        </span>
                        <span className="flex-1 text-[13.5px] text-ink">{meth.desc}</span>
                        <span className="text-ink-faint">{open ? '−' : '+'}</span>
                      </button>

                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.28, ease: EASE }}
                            className="overflow-hidden"
                          >
                            <div className="pt-3">
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-[11px] font-semibold tracking-[0.1em] text-ink-faint uppercase">
                                  cURL
                                </span>
                                <button
                                  onClick={() => copy(meth.curl)}
                                  className="press inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1 text-[11.5px] text-ink-faint hover:border-accent/50 hover:text-accent"
                                >
                                  <Copy size={11} />
                                  {copied ? 'Tersalin' : 'Salin'}
                                </button>
                              </div>
                              <pre className="overflow-x-auto rounded-ctl border border-line bg-bg p-4 font-mono text-[12px] leading-relaxed whitespace-pre-wrap break-all text-ink">
                                {meth.curl}
                              </pre>

                              <span className="mt-4 mb-2 block text-[11px] font-semibold tracking-[0.1em] text-ink-faint uppercase">
                                Response
                              </span>
                              <pre className="max-h-64 overflow-auto rounded-ctl border border-line bg-bg p-4 font-mono text-[12px] leading-relaxed text-ok">
                                {JSON.stringify(meth.response, null, 2)}
                              </pre>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
