'use client';

import { useRouter } from 'next/navigation';
import { Mail, User, LogOut, Shield, Gift } from 'lucide-react';
import Link from 'next/link';
import { LanguageSwitcher } from '@/components/member/LanguageSwitcher';
import { getSupabaseClient } from '@loyalty-os/lib';

const TIER_LABELS: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

interface ProfileClientProps {
  name: string;
  email: string;
  memberCode: string;
  tier: string;
  pointsBalance: number;
  pointsLifetime: number;
}

export function ProfileClient({ name, email, memberCode, tier, pointsBalance, pointsLifetime }: ProfileClientProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--cream, #faf8f4)' }}>
      {/* Header */}
      <div
        className="px-6 pt-10 pb-12"
        style={{ background: 'var(--brand-primary-dark, #2c3a28)' }}
      >
        <div className="flex items-center gap-4">
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">{name}</h1>
            <p className="text-sm text-white/60 mt-0.5">{TIER_LABELS[tier] ?? tier} · {memberCode}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <p className="text-2xl font-bold text-white">{pointsBalance.toLocaleString()}</p>
            <p className="text-xs text-white/60 mt-0.5">Puntos disponibles</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <p className="text-2xl font-bold text-white">{pointsLifetime.toLocaleString()}</p>
            <p className="text-xs text-white/60 mt-0.5">Puntos acumulados</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Contact Info */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Información</h3>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Mail className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-900">{email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="p-2 bg-gray-100 rounded-lg">
                <User className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Código de miembro</p>
                <p className="text-sm font-medium text-gray-900 font-mono">{memberCode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Ajustes</h3>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="px-4 py-3.5">
              <LanguageSwitcher />
            </div>
            <Link href="/profile/referrals" className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Gift className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Referir amigos</p>
                <p className="text-xs text-gray-400">Ganá puntos por cada referido</p>
              </div>
            </Link>
            <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Shield className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Privacidad y seguridad</p>
              </div>
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-red-50 transition-colors"
          >
            <div className="p-2 bg-red-50 rounded-lg">
              <LogOut className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-sm font-medium text-red-600">Cerrar sesión</p>
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">Powered by LoyaltyOS</p>
      </div>
    </div>
  );
}
