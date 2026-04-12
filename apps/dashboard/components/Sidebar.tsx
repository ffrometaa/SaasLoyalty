'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  Gift,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  QrCode,
  LifeBuoy,
} from 'lucide-react';

// Inline SVG megaphone — no external icon library per spec
function MegaphoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  );
}

// Inline SVG trophy — no external icon library per spec
function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4M5 3h14l-1 7a5 5 0 01-10 0L5 3zm0 0H3m16 0h2" />
    </svg>
  );
}
import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@loyalty-os/lib';
import { useTranslations } from 'next-intl';
import { CrispChat } from './CrispChat';

export function Sidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<{ email: string; businessName: string; plan: string } | null>(null);
  const t = useTranslations('nav');

  const navigation = [
    { name: t('overview'), href: '/', icon: Home },
    { name: t('members'), href: '/members', icon: Users },
    { name: t('rewards'), href: '/rewards', icon: Gift },
    { name: t('redemptions'), href: '/redemptions', icon: QrCode },
    { name: t('analytics'), href: '/analytics', icon: BarChart3 },
    { name: t('campaigns'), href: '/campaigns', icon: MegaphoneIcon },
    { name: t('gamification'), href: '/gamification', icon: TrophyIcon },
    { name: t('settings'), href: '/settings', icon: Settings },
  ];

  const planLabels: Record<string, string> = {
    starter: t('starterPlan'),
    pro: t('proPlan'),
    scale: t('scalePlan'),
    enterprise: t('enterprisePlan'),
  };

  useEffect(() => {
    fetch('/api/tenant/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setUserInfo(data); })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    const redirectUrl = process.env.NEXT_PUBLIC_LOGOUT_REDIRECT_URL || '/login';
    window.location.href = redirectUrl;
  };

  const initials = userInfo?.email
    ? userInfo.email.slice(0, 2).toUpperCase()
    : '··';

  return (
    <>
      {/* Mobile hamburger — only visible when sidebar is closed */}
      {!mobileMenuOpen && (
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button
            type="button"
            className="p-2 rounded-md bg-white shadow-md"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6 text-gray-600" />
          </button>
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b">
          <a href={process.env.NEXT_PUBLIC_LANDING_URL || '/'} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-purple flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">LoyaltyOS</span>
          </a>
          {/* Close button — mobile only, inside header to avoid logo overlap */}
          <button
            type="button"
            className="lg:hidden p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = item.href === '/'
            ? pathname === '/'
            : pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive
                    ? 'bg-brand-purple-50 text-brand-purple shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-0.5'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Support link — mailto for Starter, Crisp chat widget for Pro/Scale/Enterprise */}
        <div className="px-4 pb-2">
          <a
            href="mailto:support@loyalbase.dev"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-0.5 transition-all duration-150"
          >
            <LifeBuoy className="h-5 w-5" />
            {t('support')}
          </a>
        </div>

        {/* Crisp live chat — injected for Pro/Scale/Enterprise */}
        {userInfo && <CrispChat plan={userInfo.plan} />}

        {/* User section */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-brand-purple-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-brand-purple">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userInfo?.businessName || userInfo?.email || '—'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {userInfo ? (planLabels[userInfo.plan] ?? userInfo.plan) : '—'}
              </p>
            </div>
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-gray-600" title={t('logout')}>
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
