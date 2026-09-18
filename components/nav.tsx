'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House } from '@phosphor-icons/react/dist/csr/House';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { GraduationCap } from '@phosphor-icons/react/dist/csr/GraduationCap';
import { CalendarDots } from '@phosphor-icons/react/dist/csr/CalendarDots';
import { Database } from '@phosphor-icons/react/dist/csr/Database';

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
    <header className="topnav">
      <div className="topnav-inner">
        <Link href="/" className="wordmark" aria-label="SakuKampus">
          <Logo />
          SakuKampus
        </Link>

        <nav className="nav-links" aria-label="Navigasi utama">
          {ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="nav-link"
              data-active={isActive(pathname, href)}
              aria-current={isActive(pathname, href) ? 'page' : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="tabbar" aria-label="Navigasi utama">
      <div className="tabbar-inner">
        {ITEMS.map(({ href, short, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className="tab"
              data-active={active}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={20} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
              {short}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
