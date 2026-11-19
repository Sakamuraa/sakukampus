'use client';

import { useRef, useState } from 'react';
import { ShareNetwork } from '@phosphor-icons/react/dist/ssr/ShareNetwork';
import { toBlob } from 'html-to-image';
import { Button } from '@/components/ui/button';

type ShareScholarship = {
  slug: string;
  name: string;
  provider: string;
  benefit: string;
  tier: string;
  jenjang: string[];
  scope: string;
};

const SHARE_CARD_COLORS = {
  paper: '#f4f1e9',
  ink: '#17140f',
  muted: '#4b463c',
  faint: '#746c5d',
  accent: '#0d5b63',
  accentSoft: '#d9edef',
  rule: '#c2b8a2',
  white: '#fffdf8',
} as const;

function formatScope(scope: string) {
  return scope
    .toLocaleLowerCase('id-ID')
    .replace(/\b[a-z]/g, (letter) => letter.toLocaleUpperCase('id-ID'))
    .replace(/\bUin\b/g, 'UIN');
}

export function ShareScholarshipButton({
  scholarship,
  detailPath,
}: {
  scholarship: ShareScholarship;
  detailPath: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const createCardBlob = async () => {
    const card = cardRef.current;
    if (!card) throw new Error('Kartu belum siap.');

    await document.fonts.ready;
    await Promise.all(Array.from(card.querySelectorAll('img'), (image) => image.decode()));

    const heading = document.querySelector('h1');
    card.style.fontFamily = getComputedStyle(document.body).fontFamily;
    const displayFont = heading
      ? getComputedStyle(heading).fontFamily
      : 'Georgia, "Times New Roman", serif';
    card.querySelectorAll<HTMLElement>('[data-share-font="display"]').forEach((element) => {
      element.style.fontFamily = displayFont;
    });

    const blob = await toBlob(card, {
      backgroundColor: SHARE_CARD_COLORS.paper,
      cacheBust: true,
      pixelRatio: 2,
    });
    if (!blob) throw new Error('Renderer tidak menghasilkan gambar.');
    return blob;
  };

  const downloadCard = (blob: Blob) => {
    const imageUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = imageUrl;
    anchor.download = `${scholarship.slug}.png`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
  };

  const share = async () => {
    setBusy(true);
    setMessage('');

    try {
      const url = new URL(detailPath, window.location.origin).href;
      const text = `${scholarship.name}\n${url}`;

      if (window.matchMedia('(pointer: fine)').matches) {
        const blobPromise = createCardBlob();
        if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({
                'image/png': blobPromise,
                'text/plain': new Blob([text], { type: 'text/plain' }),
              }),
            ]);
            setMessage('Kartu PNG dan tautan disalin. Tempelkan langsung ke Discord.');
            return;
          } catch (error) {
            console.error('Gagal menyalin kartu beasiswa ke clipboard.', error);
          }
        }

        const blob = await blobPromise;
        const linkCopy = navigator.clipboard?.writeText
          ? navigator.clipboard.writeText(text)
          : null;
        downloadCard(blob);
        if (linkCopy) {
          try {
            await linkCopy;
            setMessage('PNG diunduh dan tautan disalin. Lampirkan PNG ke Discord.');
          } catch (error) {
            console.error('Gagal menyalin tautan beasiswa.', error);
            setMessage(`PNG diunduh. Clipboard ditolak, salin tautan ini: ${url}`);
          }
        } else {
          setMessage(`PNG diunduh. Clipboard tidak didukung, salin tautan ini: ${url}`);
        }
        return;
      }

      const blob = await createCardBlob();
      const file = new File([blob], `${scholarship.slug}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: scholarship.name, text, url });
        setMessage('Kartu dan tautan beasiswa siap dibagikan.');
        return;
      }

      downloadCard(blob);

      if (navigator.share) {
        await navigator.share({ title: scholarship.name, text, url });
        setMessage('Kartu diunduh dan tautan beasiswa dibagikan.');
      } else if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          setMessage('Kartu diunduh dan tautan beasiswa disalin.');
        } catch (error) {
          console.error('Gagal menyalin tautan beasiswa.', error);
          setMessage(`Kartu diunduh. Salin tautan ini secara manual: ${url}`);
        }
      } else {
        setMessage(`Kartu diunduh. Salin tautan ini secara manual: ${url}`);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setMessage('Berbagi dibatalkan.');
      } else {
        console.error('Gagal membuat atau membagikan kartu beasiswa.', error);
        setMessage('Kartu gagal dibuat. Coba lagi atau salin alamat halaman ini.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={share}
        disabled={busy}
        aria-label={`Bagikan ${scholarship.name}`}
      >
        <ShareNetwork size={15} weight="bold" aria-hidden="true" />
        {busy ? 'Menyiapkan kartu...' : 'Bagikan'}
      </Button>
      {message && (
        <p className="w-full text-[12px] leading-relaxed text-ink-faint" aria-live="polite">
          {message}
        </p>
      )}

      <div aria-hidden="true" className="pointer-events-none relative h-0 w-0 overflow-hidden">
        <div
          ref={cardRef}
          className="absolute top-0 left-0 flex flex-col border p-[56px]"
          style={{
            width: 1080,
            height: 1350,
            borderColor: SHARE_CARD_COLORS.rule,
            backgroundColor: SHARE_CARD_COLORS.paper,
            color: SHARE_CARD_COLORS.ink,
          }}
        >
          <div
            className="flex items-center justify-between border-b pb-6"
            style={{ borderColor: SHARE_CARD_COLORS.rule }}
          >
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="" width={52} height={52} className="h-[52px] w-[52px] object-contain" />
              <span
                className="text-[25px] font-bold tracking-[-0.04em]"
                style={{ color: SHARE_CARD_COLORS.ink }}
              >
                SakuKampus
              </span>
            </div>
            <span
              className="text-[15px] font-bold tracking-[0.16em] uppercase"
              style={{ color: SHARE_CARD_COLORS.accent }}
            >
              Info beasiswa
            </span>
          </div>

          <section
            className="mt-10 rounded-[14px] p-12"
            style={{ backgroundColor: SHARE_CARD_COLORS.accent, color: SHARE_CARD_COLORS.white }}
          >
            <p
              className="text-[18px] leading-snug font-semibold"
              style={{ color: SHARE_CARD_COLORS.accentSoft }}
            >
              {scholarship.provider}
            </p>
            <h2
              data-share-font="display"
              className="mt-7 line-clamp-3 text-[66px] leading-[1.04] font-semibold tracking-[-0.035em]"
              style={{ color: SHARE_CARD_COLORS.white }}
            >
              {scholarship.name}
            </h2>
            <p
              className="mt-7 line-clamp-3 max-w-[850px] text-[23px] leading-[1.5]"
              style={{ color: SHARE_CARD_COLORS.accentSoft }}
            >
              {scholarship.benefit}
            </p>
          </section>

          <div
            className="mt-10 grid grid-cols-2 gap-x-10 gap-y-7 border-t pt-7"
            style={{ borderColor: SHARE_CARD_COLORS.rule }}
          >
            <div>
              <p
                className="text-[13px] font-bold tracking-[0.12em] uppercase"
                style={{ color: SHARE_CARD_COLORS.faint }}
              >
                Jenjang
              </p>
              <p className="mt-2 text-[22px] font-semibold">{scholarship.jenjang.join(', ')}</p>
            </div>
            <div>
              <p
                className="text-[13px] font-bold tracking-[0.12em] uppercase"
                style={{ color: SHARE_CARD_COLORS.faint }}
              >
                Jenis program
              </p>
              <p className="mt-2 text-[22px] font-semibold">{scholarship.tier}</p>
            </div>
            <div className="col-span-2">
              <p
                className="text-[13px] font-bold tracking-[0.12em] uppercase"
                style={{ color: SHARE_CARD_COLORS.faint }}
              >
                Cakupan
              </p>
              <p className="mt-2 text-[19px] leading-snug font-semibold">
                {formatScope(scholarship.scope)}
              </p>
            </div>
          </div>

          <footer
            className="mt-auto flex items-end justify-between border-t pt-6"
            style={{ borderColor: SHARE_CARD_COLORS.rule }}
          >
            <div>
              <p
                className="text-[12px] font-bold tracking-[0.14em] uppercase"
                style={{ color: SHARE_CARD_COLORS.faint }}
              >
                Lihat syarat dan detail
              </p>
              <p className="mt-1 text-[19px] font-bold" style={{ color: SHARE_CARD_COLORS.accent }}>
                sakukampus.web.id
              </p>
            </div>
            <span className="text-[15px] font-semibold" style={{ color: SHARE_CARD_COLORS.muted }}>
              Beasiswa 2026
            </span>
          </footer>
        </div>
      </div>
    </>
  );
}
