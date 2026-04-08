'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  const NAV_ITEMS = [
    {
      href: '/',
      label: t('home'),
      icon: (active: boolean) => (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
          stroke={active ? 'var(--brand-primary-dark)' : 'var(--muted)'} strokeWidth="1.8">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      href: '/rewards',
      label: t('rewards'),
      icon: (active: boolean) => (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
          stroke={active ? 'var(--brand-primary-dark)' : 'var(--muted)'} strokeWidth="1.8">
          <path d="M12 8v13m0-13V6a4 4 0 014-4h1m-5 6H6a4 4 0 01-4-4V6a4 4 0 014-4h1" />
        </svg>
      ),
    },
    {
      href: '/challenges',
      label: t('challenges'),
      icon: (active: boolean) => (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
          stroke={active ? 'var(--brand-primary-dark)' : 'var(--muted)'} strokeWidth="1.8">
          <circle cx="12" cy="12" r="10" />
          <polygon points="10 8 16 12 10 16 10 8" />
        </svg>
      ),
    },
    {
      href: '/leaderboard',
      label: t('leaderboard'),
      icon: (active: boolean) => (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
          stroke={active ? 'var(--brand-primary-dark)' : 'var(--muted)'} strokeWidth="1.8">
          <rect x="18" y="3" width="4" height="18" rx="1" />
          <rect x="10" y="8" width="4" height="13" rx="1" />
          <rect x="2" y="13" width="4" height="8" rx="1" />
        </svg>
      ),
    },
    {
      href: '/profile',
      label: t('profile'),
      icon: (active: boolean) => (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
          stroke={active ? 'var(--brand-primary-dark)' : 'var(--muted)'} strokeWidth="1.8">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex safe-bottom z-50"
      style={{
        background: 'white',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 0px)',
      }}
    >
      {NAV_ITEMS.map(({ href, label, icon }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-1 pt-2.5 pb-2 cursor-pointer"
          >
            <div className="relative">{icon(active)}</div>
            <span
              className="text-[10px] transition-colors"
              style={{ color: active ? 'var(--brand-primary-dark)' : 'var(--muted)' }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
