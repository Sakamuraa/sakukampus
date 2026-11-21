/**
 * Karakter pendamping halaman dokumentasi.
 *
 * Gambarnya dipotong jadi empat lapis — kepala, kelopak mata, tangan, dan
 * badan — supaya masing-masing bisa bergerak sendiri: kepala mengangguk,
 * tangan bergerak seperti sedang menangkup, badan bernapas, dan mata
 * berkedip. Semuanya animasi CSS murni, tidak ada listener scroll, jadi
 * komponen ini tetap server component dan markup server = markup klien.
 *
 * Lapisan tangan sengaja ditaruh di dalam pembungkus napas badan, bukan
 * sebagai saudara, supaya ikut terskala bersama badan dan rim potongannya
 * tidak pernah terlihat dobel. Lapisan kelopak ditaruh di dalam pembungkus
 * angguk kepala supaya ikut bergeser bersama wajah.
 *
 * Blok `prefers-reduced-motion` global di app/globals.css sudah mematikan
 * seluruh keyframe di bawah untuk pengguna yang memintanya.
 */

// Geometri lapisan. rem-head.png 560x429, rem-body.png & rem-hands.png
// 560x594, disusun dalam kanvas 560x991. Badan sengaja mulai 32px di atas
// potongan leher supaya kepala yang berputar sedikit tidak membuka celah.
const FRAME_W = 560;
const FRAME_H = 991;
const HEAD_H = 429;
const BODY_H = 594;
const BODY_TOP = 397;
// Poros putar kepala: pangkal leher.
const NECK_X = 293;
const NECK_Y = 429;
// Poros putar tangan: titik tangkup di depan dada.
const HANDS_X = 250;
const HANDS_Y = 560;
// Lapisan kelopak mata: potongan kecil di dalam kanvas kepala. Nilai Y
// menempatkan garis bulu mata aset tepat di dasar bola mata (baris 248-290
// pada kepala) setelah lapisan ini direntangkan oleh animasi rem-blink.
const EYES_X = 268;
const EYES_Y = 238;
const EYES_W = 90;
const EYES_H = 74;

const pct = (v: number, total: number) => `${((v / total) * 100).toFixed(2)}%`;

export default function Karakter({
  headSrc,
  eyesSrc,
  bodySrc,
  handsSrc,
  alt,
  caption,
}: {
  headSrc: string;
  eyesSrc: string;
  bodySrc: string;
  handsSrc: string;
  alt: string;
  caption: string;
}) {
  return (
    <figure className="relative m-0">
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

          <div className="absolute inset-x-0" style={{ top: pct(BODY_TOP, FRAME_H) }}>
            <div className="rem-breathe" style={{ transformOrigin: '50% 100%' }}>
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bodySrc}
                  alt=""
                  aria-hidden
                  width={FRAME_W}
                  height={BODY_H}
                  className="block h-auto w-full"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0">
                  <div
                    className="rem-hands"
                    style={{
                      transformOrigin: `${pct(HANDS_X, FRAME_W)} ${pct(HANDS_Y - BODY_TOP, BODY_H)}`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={handsSrc}
                      alt=""
                      aria-hidden
                      width={FRAME_W}
                      height={BODY_H}
                      className="block h-auto w-full"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 top-0">
            <div
              className="rem-bob relative"
              style={{ transformOrigin: `${pct(NECK_X, FRAME_W)} ${pct(NECK_Y, HEAD_H)}` }}
            >
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
              <div
                className="rem-blink absolute"
                style={{
                  left: pct(EYES_X, FRAME_W),
                  top: pct(EYES_Y, HEAD_H),
                  width: pct(EYES_W, FRAME_W),
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={eyesSrc}
                  alt=""
                  aria-hidden
                  width={EYES_W}
                  height={EYES_H}
                  className="block h-auto w-full"
                  loading="lazy"
                  decoding="async"
                />
              </div>
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