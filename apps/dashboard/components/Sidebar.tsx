'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  Gift,
  BarChart3,
  Megaphone,
  Settings,
  LogOut,
  Menu,
  X,
  QrCode,
} from 'lucide-react';

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
    { name: t('campaigns'), href: '/campaigns', icon: Megaphone },
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
    window.location.href = 'https://loyalbase.dev/login';
  };

  const initials = userInfo?.email
    ? userInfo.email.slice(0, 2).toUpperCase()
    : '··';

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          type="button"
          className="p-2 rounded-md bg-white shadow-md"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-gray-600" />
          ) : (
            <Menu className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

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
        <div className="h-16 flex items-center px-6 border-b">
          <a href="https://loyalbase.dev" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-purple flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">LoyaltyOS</span>
          </a>
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
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-brand-purple-50 text-brand-purple'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

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
