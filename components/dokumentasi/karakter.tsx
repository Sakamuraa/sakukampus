/**
 * Karakter pendamping halaman dokumentasi.
 *
 * Kepala, tangan, dan badan bergerak pada lapisan terpisah.
 * Semuanya animasi CSS murni, tidak ada listener scroll, jadi komponen ini
 * tetap server component dan markup server = markup klien.
 *
 * Lapisan tangan dibatasi ke area tangannya dan mengikuti napas badan.
 *
 * Blok `prefers-reduced-motion` global di app/globals.css sudah mematikan
 * seluruh keyframe di bawah untuk pengguna yang memintanya.
 */

// Geometri lapisan. rem-head.png 560x429 dan rem-body.png/rem-hands.png 560x594,
// disusun dalam kanvas 560x991. Badan sengaja mulai 32px di atas
// potongan leher supaya kepala yang berputar sedikit tidak membuka celah.
const FRAME_W = 560;
const FRAME_H = 991;
const HEAD_H = 429;
const BODY_H = 594;
const BODY_TOP = 397;
const HANDS_X = 250;
const HANDS_Y = 163;
const HANDS_W = 148;
const HANDS_H = 183;
const HANDS_IMAGE_X = 130;
const HANDS_IMAGE_Y = 68;
// Poros putar kepala: pangkal leher.
const NECK_X = 293;
const NECK_Y = 429;

const pct = (v: number, total: number) => `${((v / total) * 100).toFixed(2)}%`;

export default function Karakter({
  headSrc,
  bodySrc,
  handsSrc,
  alt,
  caption,
}: {
  headSrc: string;
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
      <div className="relative overflow-hidden rounded-card border border-line-strong">
        <div className="relative w-full" style={{ aspectRatio: `${FRAME_W} / ${FRAME_H}` }}>
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
                <div
                  className="rem-hands absolute"
                  style={{
                    left: pct(HANDS_IMAGE_X, FRAME_W),
                    top: pct(HANDS_IMAGE_Y, BODY_H),
                    width: pct(HANDS_W, FRAME_W),
                    height: pct(HANDS_H, BODY_H),
                    transformOrigin: `${pct(HANDS_X - HANDS_IMAGE_X, HANDS_W)} ${pct(HANDS_Y - HANDS_IMAGE_Y, HANDS_H)}`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/dokumentasi/rem-hands-layer.png"
                    alt=""
                    aria-hidden
                    width={HANDS_W}
                    height={HANDS_H}
                    className="block h-full w-full"
                    loading="lazy"
                    decoding="async"
                  />
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