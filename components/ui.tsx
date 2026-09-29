import { SealCheck } from '@phosphor-icons/react/dist/ssr/SealCheck';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { ArrowSquareOut } from '@phosphor-icons/react/dist/ssr/ArrowSquareOut';
import type { Candidate, DisplayState, StageStatus } from '@/lib/match';
import { cn } from '@/lib/utils';

/* One place turns a number into rupiah, a timestamp into Indonesian, and a
   state into a label. Every page imports from here, so a label can never mean
   two different things on two different screens. */

export const rp = (n: number | null | undefined): string =>
  n === null || n === undefined ? 'tidak dicantumkan' : `Rp${n.toLocaleString('id-ID')}`;

export const tanggal = (s: string | number | null): string => {
  if (s === null) return 'tidak ada';
  const d = typeof s === 'number' ? new Date(s) : new Date(s);
  if (Number.isNaN(d.getTime())) return 'tidak ada';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const sisaHari = (target: number): number =>
  Math.ceil((target - Date.now()) / 86_400_000);

/** `tutup` is its own state, never folded into "perlu data": there is no data
    left to complete for a closed intake. */
export const STATE_LABEL: Record<DisplayState, string> = {
  lolos: 'Lolos',
  perlu_data: 'Perlu data',
  tidak: 'Belum memenuhi',
  tutup: 'Pendaftaran tutup',
};

const STATE_TONE: Record<DisplayState, 'ok' | 'warn' | 'neutral'> = {
  lolos: 'ok',
  perlu_data: 'warn',
  tidak: 'neutral',
  tutup: 'neutral',
};

export const STAGE_LABEL: Record<StageStatus, string> = {
  buka: 'Sedang dibuka',
  akan_datang: 'Belum dibuka',
  tutup: 'Sudah tutup',
  tanpa_jadwal: 'Jadwal menyusul',
};

export const TIER_LABEL: Record<string, string> = {
  kampus: 'Kampus',
  pemerintah: 'Pemerintah',
  swasta: 'Swasta',
};

export function StateBadge({ state }: { state: DisplayState }) {
  const tone = STATE_TONE[state];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-2.5 py-[3px] text-[11px] font-semibold tracking-[0.01em] uppercase',
        tone === 'ok' && 'border-ok/30 bg-ok-soft text-ok',
        tone === 'warn' && 'border-warn/30 bg-warn-soft text-warn',
        tone === 'neutral' && 'border-line bg-surface-2 text-ink-faint',
      )}
    >
      {STATE_LABEL[state]}
    </span>
  );
}

/** Provenance stamp — no figure appears without an origin and a date. */
export function SourceStamp({
  url,
  verifiedAt,
  confidence,
}: {
  url: string;
  verifiedAt: string;
  confidence?: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-[3px] text-[11px] font-semibold text-ink-dim uppercase">
        <SealCheck size={12} weight="fill" aria-hidden="true" />
        Diperiksa {tanggal(verifiedAt)}
      </span>
      {confidence !== undefined && confidence < 100 && (
        <span className="inline-flex items-center rounded-full border border-line bg-surface-2 px-2.5 py-[3px] text-[11px] font-semibold text-ink-faint uppercase">
          Keyakinan {confidence}%
        </span>
      )}
      <a
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        className="press inline-flex items-center gap-1 text-[12px] text-ink-faint underline decoration-line underline-offset-3 hover:text-ink-dim"
      >
        Sumber resmi
        <ArrowSquareOut size={12} aria-hidden="true" />
      </a>
    </div>
  );
}

/**
 * Reason list for one scholarship. The three marks are deliberately different
 * shapes (tick, cross, question) so the state survives greyscale and colour
 * blindness.
 */
export function Reasons({ reasons }: { reasons: Candidate['reasons'] }) {
  return (
    <ul className="grid gap-1.5">
      {reasons.map((r, i) => (
        <li
          key={`${r.label}-${i}`}
          className={cn(
            'flex gap-2.5 text-[13.5px] leading-snug',
            r.skipped && 'opacity-55',
            r.ok === true ? 'text-ink-dim' : 'text-ink-faint',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'num mt-px w-3.5 shrink-0 text-center text-[13px] font-bold',
              r.skipped ? 'text-ink-faint' : r.ok === true ? 'text-ok' : r.ok === false ? 'text-warn' : 'text-ink-faint',
            )}
          >
            {r.skipped ? '·' : r.ok === true ? '✓' : r.ok === false ? '×' : '?'}
          </span>
          <span>
            {r.label}
            {r.skipped && <span className="text-ink-faint"> · tidak berlaku untuk kampusmu</span>}
            {r.soft && !r.skipped && (
              <span className="text-ink-faint"> · prioritas, bukan syarat wajib</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Honest caveat. Used where the data is thinner than the reader would assume. */
export function Caveat({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mt-4 flex items-start gap-2.5 rounded-card border border-warn/30 bg-warn-soft px-4 py-3.5">
      <Warning size={16} weight="fill" aria-hidden="true" className="mt-0.5 shrink-0 text-warn" />
      <p className="text-[13.5px] leading-relaxed text-ink-dim">
        {children ??
          'Beasiswa nasional dinilai dengan plafon rupiah. Nomor golongan hanya berlaku di kampus penerbit dekritnya.'}
      </p>
    </div>
  );
}

export function SectionHead({
  title,
  action,
  note,
}: {
  title: string;
  action?: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
      <div>
        <h2 className="text-[clamp(1.25rem,2.4vw,1.55rem)] font-bold tracking-[-0.025em] text-ink">
          {title}
        </h2>
        {note && <p className="mt-1.5 max-w-[58ch] text-[13.5px] text-ink-faint">{note}</p>}
      </div>
      {action}
    </div>
  );
}

/** Section wrapper: consistent vertical rhythm without a component per section. */
export function Section({
  children,
  tight,
}: {
  children: React.ReactNode;
  tight?: boolean;
}) {
  return <section className={tight ? 'py-7' : 'py-10'}>{children}</section>;
}
