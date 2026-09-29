'use client';

import { useState } from 'react';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr/ArrowUpRight';
import ApiDocModal from '@/components/ui/api-doc-modal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const API_ENDPOINTS = [
  ['/api/v1/institutions', 'Cari kampus atau ambil detail UKT'],
  ['/api/v1/scholarships', 'Katalog beasiswa dengan jadwal dan syarat'],
  ['/api/v1/calendar', 'Seluruh tenggat, terurut'],
  ['/api/v1/meta/sources', 'Halaman ini dalam JSON'],
  ['/api/v1/eligibility/check', 'Periksa kelayakan (POST)'],
] as const;

export default function DataPageClient() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <p className="text-[15px] font-semibold text-ink">API publik</p>
            <p className="mt-1 text-[13px] text-ink-faint">
              Semua data tersedia tanpa kunci.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            Lihat dokumentasi
          </Button>
        </div>

        <div className="divide-y divide-line">
          {API_ENDPOINTS.map(([path, desc]) => (
            <button
              key={path}
              onClick={() => setOpen(true)}
              className="press flex w-full items-center gap-4 px-5 py-3.5 text-left hover:bg-surface-2 sm:px-6"
            >
              <code className="font-mono text-[12.5px] font-medium text-accent">{path}</code>
              <span className="ml-auto hidden text-right text-[13px] text-ink-faint sm:block">
                {desc}
              </span>
              <ArrowUpRight size={14} className="shrink-0 text-ink-faint" />
            </button>
          ))}
        </div>
      </div>

      {open && <ApiDocModal onClose={() => setOpen(false)} />}
    </>
  );
}
