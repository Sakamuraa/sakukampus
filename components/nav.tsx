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
    <header className="sticky top-0 z-50 hidden border-b border-line-strong bg-bg/92 backdrop-blur-md supports-[backdrop-filter]:bg-bg/80 lg:block">
      <div className="wrap flex h-[72px] items-center gap-10">
        <Link href="/" className="press flex shrink-0 items-center gap-2.5" aria-label="SakuKampus beranda">
          <Logo className="h-7 w-7" />
          <span className="font-display text-[18px] leading-none font-semibold tracking-[-0.02em] text-ink">
            SakuKampus
          </span>
        </Link>

        <nav className="flex min-w-0 flex-1 items-stretch gap-7 self-stretch" aria-label="Navigasi utama">
          {ITEMS.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'press relative flex items-center text-[13.5px] font-medium whitespace-nowrap',
                  'after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:origin-left after:bg-accent',
                  'after:transition-transform after:duration-200',
                  active
                    ? 'text-ink after:scale-x-100'
                    : 'text-ink-dim after:scale-x-0 hover:text-ink hover:after:scale-x-100',
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/cek"
          className="press inline-flex h-10 shrink-0 items-center justify-center rounded-ctl bg-ink px-5 text-[13.5px] font-semibold whitespace-nowrap text-bg hover:bg-accent hover:text-accent-ink"
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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line-strong bg-bg/95 backdrop-blur-md lg:hidden"
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
