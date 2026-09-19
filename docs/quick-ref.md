# SakuKampus — Quick Reference

## CSS Architecture
- TIDAK pakai Tailwind utilities. Semua styling = CSS custom di `app/globals.css`.
- Jika `tailwindcss@4.x` terinstall → auto-preflight override semua style. UNINSTALL segera.
- Class CSS tersedia: `.wrap`, `.shell`, `.row`, `.row-between`, `.stack`, `.grid-2`, `.rail`, `.card`, `.card-tight`, `.badge`, `.badge-ok`, `.badge-warn`, `.btn`, `.btn-ghost`, `.chip`, `.chips`, `.chip-rail`, `.topnav`, `.tabbar`, `.field`, `.label`, `.input`, `.select`, `.ukt-grid`, `.ukt-cell`, `.reasons`, `.sheet`, `.cta-bar`, `.skeleton`, `.notice`.
- Token aliases: Komponen pakai `var(--color-*)`, CSS pakai `var(--nama)`. Tambahkan di `:root`.
- Mobile padding-bottom: `.wrap { padding-bottom: calc(80px + env(safe-area-inset-bottom)) }`.
- Tabbar vs CTA overlap: `.cta-bar` hidden di mobile (`display: none`).

## Engineering Fixes
- Scope filter: beasiswa `kampus:XXXX` tolak untuk kampus lain (return `displayState: 'tutup'`).
- UKT null check: `s.ukt_max_idr != null` bukan `!== undefined`.
- phosphor-icons import: `from '@phosphor-icons/react'` bukan `dist/csr`.
- ShimmerButton/GlassCard prop types: tambahkan `style?: React.CSSProperties`.

## Deployment
- Build HANYA di Vercel. Panel dev cuma vitest + tsc.
- GH token: PAT langsung, no `gh` CLI.
- Git push: `git add -A && git commit -m "..." && git push origin main`.

## Scraping
- Langsung blocked dari container → pakai `r.jina.ai/<url>` proxy.
- Sources valid: Djarum, BRI Bright, Pertamina Sobat Bumi, BI, BCA Finance.

## New Components
- `components/ui/api-doc-modal.tsx` — modal dokumentasi API dengan curl examples.
- `components/ui/shimmer-button.tsx` — button dengan shimmer effect.
- `components/ui/glass-card.tsx` — glassmorphism card.
- `components/ui/badge-pill.tsx` — colored badge variants.
- `components/ui/animated-search.tsx` — search dengan glow effect.
- `components/ui/logo.tsx` — logo component (next/image).

## SEO
- Custom metadata per halaman: title, description, canonical, OG tags, Twitter cards.
- Root layout di `app/layout.tsx`.
