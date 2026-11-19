import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from '@phosphor-icons/react/dist/ssr';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { STAGE_LABEL, TIER_LABEL, rp, tanggal } from '@/components/ui';
import { ShareScholarshipButton } from '@/components/beasiswa/share-button';
import { institutionsByKode, scholarships } from '@/lib/data';
import type { Criterion, Rule } from '@/lib/eligibility/engine';
import { stageStatus, type ScholarshipSeed, type StageStatus } from '@/lib/match';

export const revalidate = 3600;

type Props = {
  params: Promise<{ id: string }>;
};

const STATUS_TONE: Record<StageStatus, 'ok' | 'warn' | 'neutral'> = {
  buka: 'ok',
  akan_datang: 'warn',
  tutup: 'neutral',
  tanpa_tenggat: 'warn',
  tanpa_jadwal: 'neutral',
};

const STAGE_NAMES: Record<string, string> = {
  assessment: 'Penilaian',
  mandiri_ptn_pts: 'Seleksi mandiri PTN/PTS',
  pendaftaran: 'Pendaftaran',
  pendaftaran_akun: 'Pembuatan akun',
  pengumuman: 'Pengumuman hasil',
  pengumuman_berkas: 'Pengumuman seleksi berkas',
  seleksi_administrasi: 'Seleksi administrasi',
  seleksi_berkas: 'Seleksi berkas',
  seleksi_substansi: 'Seleksi substansi',
  tes_bakat_skolastik: 'Tes bakat skolastik',
  tes_offline_wawancara: 'Tes offline dan wawancara',
  tes_online: 'Tes online',
  wawancara: 'Wawancara',
};

const COVERAGE_LABELS: Record<string, string> = {
  allowance: 'Tunjangan biaya hidup',
  asrama: 'Asrama',
  full: 'Pendanaan penuh',
  genbi: 'Program GenBI',
  green_program: 'Program lingkungan',
  leadership: 'Pembinaan kepemimpinan',
  luar_negeri: 'Studi luar negeri',
  non_ukt: 'Bantuan di luar UKT',
  partial: 'Bantuan sebagian',
  ukt_penuh: 'UKT penuh',
  ukt_sebagian: 'Bantuan UKT sebagian',
};

function findScholarship(id: string): ScholarshipSeed | undefined {
  return scholarships.find((scholarship) => scholarship.slug === id);
}

function getScopeLabel(scope: string): string {
  if (scope === 'nasional') return 'Nasional';

  const code = scope.split(':')[1];
  const institution = code ? institutionsByKode.get(code) : undefined;
  return institution
    ? `Khusus ${institution.namaPopuler ?? institution.nama}`
    : 'Khusus kampus tertentu';
}

function getStageLabel(name: string): string {
  return STAGE_NAMES[name] ?? name.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getCoverageLabels(coverage?: string | null): string[] {
  return coverage
    ? coverage.split('+').map((item) => COVERAGE_LABELS[item] ?? item.replaceAll('_', ' '))
    : [];
}

function CriterionItem({ criterion }: { criterion: Criterion }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-card border border-line bg-surface px-4 py-3.5">
      <div>
        <p className="text-[13.5px] leading-relaxed text-ink-dim">{criterion.label}</p>
        {criterion.onlyWhen?.scope && (
          <p className="mt-1 text-[11.5px] text-ink-faint">Berlaku pada cakupan beasiswa ini.</p>
        )}
      </div>
      {criterion.soft && <Badge variant="warn">Prioritas</Badge>}
    </div>
  );
}

function RuleDetails({ rule }: { rule: Rule }) {
  if ('fact' in rule) return <CriterionItem criterion={rule} />;

  if ('not' in rule) {
    return (
      <div className="space-y-2">
        <p className="text-[12px] font-semibold text-ink-faint">Tidak memenuhi kriteria berikut</p>
        <RuleDetails rule={rule.not} />
      </div>
    );
  }

  const isAny = 'any' in rule;
  const children = isAny ? rule.any : rule.all;

  return (
    <div className="space-y-3">
      {isAny && (
        <p className="text-[12px] font-semibold text-ink-faint">Salah satu dari syarat berikut</p>
      )}
      <div className="grid gap-2.5">
        {children.map((child, index) => (
          <RuleDetails key={`${index}`} rule={child} />
        ))}
      </div>
    </div>
  );
}

function SummaryItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11.5px] text-ink-faint">{label}</dt>
      <dd className="mt-1 text-[13px] font-medium leading-relaxed text-ink-dim">{children}</dd>
    </div>
  );
}

export async function generateStaticParams() {
  return scholarships.map((scholarship) => ({ id: scholarship.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const scholarship = findScholarship(id);

  if (!scholarship) {
    return { title: 'Beasiswa tidak ditemukan', robots: { index: false, follow: true } };
  }

  const description =
    scholarship.benefit_summary ??
    `Informasi syarat dan jadwal ${scholarship.name} dari ${scholarship.provider}.`;
  const url = `/beasiswa/${scholarship.slug}`;

  return {
    title: scholarship.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: scholarship.name,
      description,
      url,
    },
  };
}

export default async function BeasiswaDetailPage({ params }: Props) {
  const { id } = await params;
  const scholarship = findScholarship(id);
  if (!scholarship) notFound();

  const status = stageStatus(scholarship, Date.now());
  const coverage = getCoverageLabels(scholarship.coverage);
  const detailPath = `/beasiswa/${scholarship.slug}`;
  const summary =
    scholarship.benefit_summary ??
    'Ringkasan manfaat belum tersedia. Buka sumber penyelenggara untuk informasi terbaru.';

  return (
    <>
      <section className="border-b border-line-strong">
        <div className="wrap pt-10 pb-10 lg:pt-14 lg:pb-12">
          <Link
            href="/beasiswa"
            className="press inline-flex items-center gap-2 text-[13px] font-medium text-ink-faint hover:text-accent"
          >
            <ArrowLeft size={15} weight="bold" aria-hidden="true" />
            Kembali ke katalog
          </Link>

          <div className="mt-8 max-w-[860px]">
            <p className="eyebrow">Detail beasiswa</p>
            <h1 className="mt-3 font-display text-[clamp(2rem,4.5vw,3.35rem)] leading-[1.08] font-semibold tracking-[-0.03em] text-ink">
              {scholarship.name}
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-dim">{scholarship.provider}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="neutral">{TIER_LABEL[scholarship.tier]}</Badge>
              <Badge variant={STATUS_TONE[status]}>{STAGE_LABEL[status]}</Badge>
              {scholarship.academic_year && (
                <Badge variant="neutral">Tahun akademik {scholarship.academic_year}</Badge>
              )}
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/cek"
              className="press inline-flex h-11 items-center justify-center gap-2 rounded-ctl bg-accent px-4 text-sm font-semibold text-accent-ink shadow-[0_1px_0_rgba(255,255,255,0.14)_inset] hover:bg-accent-strong"
            >
              Cek kelayakan
            </Link>
            <ShareScholarshipButton
              scholarship={{
                slug: scholarship.slug,
                name: scholarship.name,
                provider: scholarship.provider,
                benefit: summary,
                tier: TIER_LABEL[scholarship.tier],
                jenjang: scholarship.jenjang,
                scope: getScopeLabel(scholarship.scope),
              }}
              detailPath={detailPath}
            />
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="wrap grid gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)] lg:gap-14">
          <main className="min-w-0 space-y-10">
            <section>
              <h2 className="font-display text-[clamp(1.45rem,2.5vw,1.9rem)] font-semibold tracking-[-0.02em] text-ink">
                Manfaat beasiswa
              </h2>
              <p className="mt-3 max-w-[65ch] text-[14px] leading-relaxed text-ink-dim">{summary}</p>
              {coverage.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {coverage.map((item) => (
                    <Badge key={item} variant="accent">
                      {item}
                    </Badge>
                  ))}
                </div>
              )}
            </section>

            <section className="border-t border-line-strong pt-8">
              <h2 className="font-display text-[clamp(1.45rem,2.5vw,1.9rem)] font-semibold tracking-[-0.02em] text-ink">
                Syarat kelayakan
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-faint">
                Rincian berikut mengikuti informasi yang tersedia dari penyelenggara.
              </p>
              <div className="mt-5">
                <RuleDetails rule={scholarship.rule} />
              </div>
            </section>

            <section className="border-t border-line-strong pt-8">
              <h2 className="font-display text-[clamp(1.45rem,2.5vw,1.9rem)] font-semibold tracking-[-0.02em] text-ink">
                Jadwal seleksi
              </h2>
              {scholarship.stages.length === 0 ? (
                <p className="mt-3 text-[13.5px] text-ink-faint">Jadwal belum diumumkan.</p>
              ) : (
                <ol className="mt-5 grid gap-3 sm:grid-cols-2">
                  {scholarship.stages.map((stage, index) => (
                    <li
                      key={`${stage.name}-${index}`}
                      className="rounded-card border border-line bg-surface px-4 py-3.5"
                    >
                      <p className="text-[13px] font-semibold text-ink">{getStageLabel(stage.name)}</p>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-ink-faint">
                        {stage.opens_at && stage.closes_at
                          ? `${tanggal(stage.opens_at)} - ${tanggal(stage.closes_at)}`
                          : stage.opens_at
                            ? `Mulai ${tanggal(stage.opens_at)}`
                            : stage.closes_at
                              ? `Tenggat ${tanggal(stage.closes_at)}`
                              : 'Tanggal belum diumumkan'}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </main>

          <aside className="space-y-4">
            <section className="rounded-card border border-line-strong bg-surface p-5 sm:p-6">
              <h2 className="font-display text-[18px] font-semibold text-ink">Ringkasan</h2>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5">
                <SummaryItem label="Penyelenggara">{scholarship.provider}</SummaryItem>
                <SummaryItem label="Cakupan">{getScopeLabel(scholarship.scope)}</SummaryItem>
                <SummaryItem label="Jenjang">{scholarship.jenjang.join(', ')}</SummaryItem>
                {scholarship.academic_year && (
                  <SummaryItem label="Tahun akademik">{scholarship.academic_year}</SummaryItem>
                )}
                {scholarship.ukt_max_idr !== undefined && (
                  <SummaryItem label="Batas UKT">{rp(scholarship.ukt_max_idr)}</SummaryItem>
                )}
                {scholarship.ukt_max_golongan !== undefined && (
                  <SummaryItem label="Golongan UKT">
                    Golongan 1-{scholarship.ukt_max_golongan}
                    {scholarship.ukt_scope_note === 'prioritas' ? ' (prioritas)' : ''}
                  </SummaryItem>
                )}
                {scholarship.needs_test && (
                  <SummaryItem label="Seleksi">Memerlukan tes</SummaryItem>
                )}
              </dl>

              {scholarship.url_pendaftaran && (
                <a
                  href={scholarship.url_pendaftaran}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="press mt-6 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-ctl border border-line-strong bg-surface-2 px-4 text-[13px] font-semibold text-ink-dim hover:border-accent hover:text-accent"
                >
                  Buka laman pendaftaran
                  <ArrowUpRight size={14} weight="bold" aria-hidden="true" />
                </a>
              )}
            </section>

            <section className="rounded-card border border-line bg-surface px-5 py-4">
              <p className="text-[12px] leading-relaxed text-ink-faint">
                {scholarship.source_kind === 'resmi' ? 'Sumber resmi' : 'Sumber informasi'}.
                Diperiksa {tanggal(scholarship.last_verified_at)}.
              </p>
              <a
                href={scholarship.source_url}
                target="_blank"
                rel="noreferrer noopener"
                className="press mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:underline"
              >
                Buka sumber
                <ArrowUpRight size={13} weight="bold" aria-hidden="true" />
              </a>
            </section>
          </aside>
        </div>
      </section>
    </>
  );
}
