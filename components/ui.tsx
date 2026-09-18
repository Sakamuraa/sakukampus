import { SealCheck } from '@phosphor-icons/react/dist/ssr/SealCheck';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { ArrowSquareOut } from '@phosphor-icons/react/dist/ssr/ArrowSquareOut';
import type { Candidate, DisplayState, StageStatus } from '@/lib/match';

/* One place that turns a number into rupiah, a timestamp into Indonesian, and a
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

/** Indonesian label for a display state. `tutup` is its own state, never folded
    into "perlu data": there is no data left to complete for a closed intake. */
export const STATE_LABEL: Record<DisplayState, string> = {
  lolos: 'Lolos',
  perlu_data: 'Perlu data',
  tidak: 'Belum memenuhi',
  tutup: 'Pendaftaran tutup',
};

export const STATE_BADGE: Record<DisplayState, string> = {
  lolos: 'badge badge-ok',
  perlu_data: 'badge badge-warn',
  tidak: 'badge badge-off',
  tutup: 'badge badge-off',
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
  return <span className={STATE_BADGE[state]}>{STATE_LABEL[state]}</span>;
}

/** Provenance stamp. Required on every scholarship card: the whole product
    promise is that no figure appears without an origin and a date. */
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
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      <span className="badge">
        <SealCheck size={12} weight="fill" aria-hidden="true" />
        Diperiksa {tanggal(verifiedAt)}
      </span>
      {confidence !== undefined && confidence < 100 && (
        <span className="badge">Keyakinan {confidence}%</span>
      )}
      <a
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: '0.75rem',
          color: 'var(--color-ink-muted)',
          textDecoration: 'underline',
          textUnderlineOffset: 3,
        }}
      >
        Sumber resmi
        <ArrowSquareOut size={12} aria-hidden="true" />
      </a>
    </div>
  );
}

/** Reason list for one scholarship. The three marks are deliberately different
    shapes (tick, cross, question) so the state survives greyscale and colour
    blindness. */
export function Reasons({ reasons }: { reasons: Candidate['reasons'] }) {
  return (
    <div>
      {reasons.map((r, i) => (
        <div
          key={`${r.label}-${i}`}
          className="reason"
          data-ok={r.skipped ? 'skip' : String(r.ok)}
          data-skip={String(!!r.skipped)}
        >
          <span className="reason-mark" aria-hidden="true">
            {/* Marks are shapes, not colours, so state survives greyscale.
                Skipped reasons show a hollow ring drawn in CSS, which keeps the
                dash characters off the page entirely. */}
            {r.skipped ? '' : r.ok === true ? '✓' : r.ok === false ? '×' : '?'}
          </span>
          <span>
            {r.label}
            {r.skipped && <span className="faint"> · tidak berlaku untuk kampusmu</span>}
            {r.soft && !r.skipped && <span className="faint"> · prioritas, bukan syarat wajib</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Honest caveat. Used where the data is thinner than the reader would assume. */
export function Caveat({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '18px 1fr',
        gap: 10,
        alignItems: 'start',
        padding: '13px 15px',
        borderRadius: 'var(--radius-card)',
        background: 'var(--color-warn-soft)',
        color: 'var(--color-warn)',
      }}
    >
      <Warning size={18} weight="fill" aria-hidden="true" style={{ marginTop: 1 }} />
      <p className="small" style={{ margin: 0, color: 'inherit' }}>
        {children}
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
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 14,
        flexWrap: 'wrap',
        marginBottom: 14,
      }}
    >
      <div>
        <h2 className="h2">{title}</h2>
        {note && (
          <p className="small faint" style={{ margin: '5px 0 0', maxWidth: '58ch' }}>
            {note}
          </p>
        )}
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
  return (
    <section style={{ padding: tight ? '28px 0' : '40px 0' }}>
      <div className="shell">{children}</div>
    </section>
  );
}