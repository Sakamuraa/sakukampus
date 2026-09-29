'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House } from '@phosphor-icons/react/dist/csr/House';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { GraduationCap } from '@phosphor-icons/react/dist/csr/GraduationCap';
import { CalendarDots } from '@phosphor-icons/react/dist/csr/CalendarDots';
import { Database } from '@phosphor-icons/react/dist/csr/Database';
import Logo from '@/components/ui/logo';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/', label: 'Beranda', short: 'Beranda', Icon: House },
  { href: '/cek', label: 'Cek kelayakan', short: 'Cek', Icon: MagnifyingGlass },
  { href: '/beasiswa', label: 'Beasiswa', short: 'Beasiswa', Icon: GraduationCap },
  { href: '/jadwal', label: 'Jadwal', short: 'Jadwal', Icon: CalendarDots },
  { href: '/data', label: 'Status data', short: 'Data', Icon: Database },
] as const;

const isActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname.startsWith(href);

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 hidden border-b border-white/[0.06] bg-bg/70 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/60 lg:block">
      <div className="wrap flex h-[68px] items-center gap-8">
        <Link href="/" className="press flex shrink-0 items-center gap-2.5" aria-label="SakuKampus beranda">
          <Logo className="h-7 w-7" />
          <span className="text-[15px] font-bold tracking-[-0.02em] text-ink">
            SakuKampus
          </span>
        </Link>

        <nav className="flex min-w-0 flex-1 items-center gap-1" aria-label="Navigasi utama">
          {ITEMS.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'press rounded-ctl px-3 py-2 text-[13.5px] font-medium whitespace-nowrap',
                  active
                    ? 'bg-surface-2 text-accent'
                    : 'text-ink-dim hover:bg-surface-2 hover:text-ink',
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/cek"
          className="press h-9 shrink-0 rounded-ctl bg-accent px-4 text-[13.5px] font-semibold text-[#14100a] hover:bg-[#ffb739]"
        >
          Cek kelayakanku
        </Link>
      </div>
    </header>
  );
}

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.07] bg-bg/85 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
    >
      <div className="grid grid-cols-5">
        {ITEMS.map(({ href, short, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'press flex h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium',
                active ? 'text-accent' : 'text-ink-faint',
              )}
            >
              <Icon size={19} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
              {short}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
