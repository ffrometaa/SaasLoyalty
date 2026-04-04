'use client';

import { useState, useEffect } from 'react';
import { Users, Gift, TrendingUp, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MetricCard } from '../../components/MetricCard';
import { useTranslations } from 'next-intl';

type Metrics = {
  activeMembers: number;
  visitsThisMonth: number;
  pointsRedeemedThisMonth: number;
  retentionRate: number;
  changes: {
    activeMembers: number;
    visitsThisMonth: number;
    pointsRedeemedThisMonth: number;
    retentionRate: number;
  };
};

export default function DashboardPage() {
  const router = useRouter();
  const t = useTranslations('dashboard');
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.metrics) setMetrics(data.metrics); });
  }, []);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-gray-600 mt-1">{t('subtitle')}</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard
          title={t('activeMembers')}
          value={metrics ? String(metrics.activeMembers) : '—'}
          change={metrics?.changes.activeMembers ?? 0}
          icon={Users}
        />
        <MetricCard
          title={t('visitsThisMonth')}
          value={metrics ? String(metrics.visitsThisMonth) : '—'}
          change={metrics?.changes.visitsThisMonth ?? 0}
          icon={Calendar}
        />
        <MetricCard
          title={t('pointsRedeemed')}
          value={metrics ? String(metrics.pointsRedeemedThisMonth) : '—'}
          change={metrics?.changes.pointsRedeemedThisMonth ?? 0}
          icon={Gift}
        />
        <MetricCard
          title={t('retentionRate')}
          value={metrics ? `${metrics.retentionRate}%` : '—'}
          change={metrics?.changes.retentionRate ?? 0}
          icon={TrendingUp}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('quickActions')}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <button onClick={() => router.push('/members')} className="p-4 bg-white rounded-lg border hover:border-brand-purple hover:shadow-md transition-all text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-brand-purple" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{t('addMember')}</p>
                <p className="text-sm text-gray-500">{t('addMemberDesc')}</p>
              </div>
            </div>
          </button>
          <button onClick={() => router.push('/rewards')} className="p-4 bg-white rounded-lg border hover:border-brand-purple hover:shadow-md transition-all text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Gift className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{t('createReward')}</p>
                <p className="text-sm text-gray-500">{t('createRewardDesc')}</p>
              </div>
            </div>
          </button>
          <button onClick={() => router.push('/redemptions')} className="p-4 bg-white rounded-lg border hover:border-brand-purple hover:shadow-md transition-all text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{t('registerVisit')}</p>
                <p className="text-sm text-gray-500">{t('registerVisitDesc')}</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{t('recentActivity')}</h2>
        </div>
        <div className="divide-y">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-sm font-medium text-green-600">+150</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Maria Garcia</p>
                <p className="text-sm text-gray-500">Earned 150 points</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">2 min ago</p>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-purple-100 flex items-center justify-center">
                <Gift className="h-5 w-5 text-brand-purple" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Carlos Rodriguez</p>
                <p className="text-sm text-gray-500">Redeemed: Free Massage</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">15 min ago</p>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">New member joined</p>
                <p className="text-sm text-gray-500">Ana Martinez</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">1 hour ago</p>
          </div>
        </div>
      </div>
    </div>
  );
}
