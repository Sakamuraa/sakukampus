'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CaretDown } from '@phosphor-icons/react/dist/csr/CaretDown';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { cn } from '@/lib/utils';

export type SelectOption = { value: string; label: string; hint?: string };

type Pos = { top: number; left: number; width: number; maxHeight: number };

const EASE = [0.22, 1, 0.36, 1] as const;
const GAP = 6;
const MAX_H = 288;

/**
 * Custom select. Native <select> cannot be styled consistently across
 * platforms, cannot search, and renders its own dropdown outside our control.
 *
 * The popover is fixed-positioned from the trigger rect so it never gets
 * clipped by a scrollable parent or a dialog.
 */
export function Select({
  id,
  value,
  onChange,
  options,
  placeholder = 'Pilih salah satu',
  searchable = false,
  disabled = false,
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<Pos | null>(null);
  const [hovering, setHovering] = useState(false);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = searchable && query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const roomBelow = vh - r.bottom - GAP;
    const roomAbove = r.top - GAP;
    const openUp = roomBelow < 180 && roomAbove > roomBelow;
    const maxHeight = Math.max(
      160,
      Math.min(MAX_H, openUp ? roomAbove : roomBelow),
    );
    setPos({
      top: openUp ? r.top - GAP - maxHeight : r.bottom + GAP,
      left: Math.min(r.left, Math.max(8, window.innerWidth - r.width - 8)),
      width: r.width,
      maxHeight,
    });
  }, []);

  const openList = useCallback(() => {
    if (disabled) return;
    setQuery('');
    place();
    setOpen(true);
  }, [disabled, place]);

  const close = useCallback((focus = true) => {
    setOpen(false);
    if (focus) triggerRef.current?.focus();
  }, []);

  const pick = useCallback(
    (next: string) => {
      onChange(next);
      close();
    },
    [onChange, close],
  );

  // Position follows scroll and resize while open.
  useLayoutEffect(() => {
    if (!open) return;
    place();
    const on = () => place();
    window.addEventListener('scroll', on, true);
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on, true);
      window.removeEventListener('resize', on);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (open && searchable) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open, searchable]);

  useEffect(() => {
    if (open) setActive(Math.max(0, filtered.findIndex((o) => o.value === value)));
  }, [open, value, filtered]);

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!open) openList();
    }
  };

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[active]) pick(filtered[active].value);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(filtered.length - 1);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={onTriggerKey}
        className={cn(
          'press flex h-11 w-full items-center gap-2 rounded-ctl border bg-surface-2 px-3.5 text-left',
          'text-[15px]',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          open ? 'border-accent/60 ring-2 ring-accent/25' : 'border-line hover:border-line-strong',
        )}
      >
        <span
          className={cn(
            'min-w-0 flex-1 truncate',
            selected ? 'text-ink' : 'text-ink-faint',
          )}
        >
          {selected ? selected.label : placeholder}
        </span>
        <CaretDown
          size={14}
          className={cn('shrink-0 text-ink-faint transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {open && pos && (
          <motion.div
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-activedescendant={
              filtered[active] ? `${listId}-opt-${filtered[active].value}` : undefined
            }
            onKeyDown={onListKey}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            className="fixed z-[80] overflow-hidden rounded-card border border-line bg-surface shadow-[0_28px_60px_-24px_rgba(0,0,0,0.95)] focus:outline-none"
            style={{
              top: pos.top,
              left: pos.left,
              width: pos.width,
              maxHeight: pos.maxHeight,
            }}
            initial={{ opacity: 0, y: -6, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.985 }}
            transition={{ duration: 0.16, ease: EASE }}
          >
            {searchable && (
              <div className="flex items-center gap-2.5 border-b border-line px-3.5 py-2.5">
                <MagnifyingGlass size={15} className="shrink-0 text-ink-faint" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  placeholder="Cari program studi"
                  aria-label="Cari program studi"
                  className="w-full bg-transparent text-[14px] text-ink placeholder:text-ink-faint focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="press shrink-0 text-[11.5px] text-ink-faint hover:text-ink"
                  >
                    Hapus
                  </button>
                )}
              </div>
            )}

            <div
              className="overflow-y-auto overscroll-contain py-1"
              style={{ maxHeight: pos.maxHeight - (searchable ? 46 : 0) }}
              onMouseOver={(e) => {
                const t = (e.target as HTMLElement).closest('[data-opt]') as HTMLElement | null;
                if (t && t.dataset.idx) setActive(Number(t.dataset.idx));
              }}
            >
              {filtered.length === 0 && (
                <p className="px-4 py-3.5 text-[13.5px] text-ink-faint">
                  Tidak ada yang cocok dengan “{query.trim()}”.
                </p>
              )}

              {filtered.map((o, i) => {
                const on = o.value === value;
                const isActive = i === active;
                return (
                  <div
                    key={o.value}
                    id={`${listId}-opt-${o.value}`}
                    data-opt
                    data-idx={i}
                    role="option"
                    aria-selected={on}
                    onClick={() => pick(o.value)}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 px-4 py-2.5',
                      isActive && !hovering && 'bg-surface-2',
                      on && 'bg-accent/8',
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 shrink-0 rounded-full',
                        on ? 'bg-accent' : 'bg-transparent',
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate text-[14px]',
                          on ? 'font-semibold text-ink' : 'text-ink-dim',
                        )}
                      >
                        {o.label}
                      </span>
                      {o.hint && (
                        <span className="block truncate text-[12px] text-ink-faint">{o.hint}</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
