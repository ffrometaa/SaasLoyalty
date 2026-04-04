import { createServerSupabaseClient } from '@loyalty-os/lib/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getCampaignById, getCampaignMetrics, getCampaignNotifications } from '../../../../../lib/campaigns/queries';
import CampaignResultsChart from '../../../../../components/dashboard/CampaignResultsChart';
import { getTranslations } from 'next-intl/server';
import type { Plan } from '../../../../../lib/plans/features';

async function resolveAuthedTenant(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
): Promise<{ tenantId: string; plan: Plan } | null> {
  const { data: { session } } = await (supabase.auth as any).getSession();
  if (!session?.user) return null;

  const { data: ownerTenant } = await supabase
    .from('tenants')
    .select('id, plan')
    .eq('auth_user_id', session.user.id)
    .is('deleted_at', null)
    .single();

  if (ownerTenant?.id) return { tenantId: ownerTenant.id, plan: ownerTenant.plan as Plan };

  const { data: staffRecord } = await supabase
    .from('tenant_users')
    .select('tenant_id, tenants(plan)')
    .eq('auth_user_id', session.user.id)
    .single();

  if (staffRecord?.tenant_id) {
    const plan = (staffRecord.tenants as { plan: string } | null)?.plan ?? 'starter';
    return { tenantId: staffRecord.tenant_id, plan: plan as Plan };
  }

  return null;
}

const SEGMENT_LABELS: Record<string, string> = {
  all: 'All Members',
  active: 'Active',
  at_risk: 'At Risk',
  inactive: 'Inactive',
  tier_bronze: 'Bronze Tier',
  tier_silver: 'Silver Tier',
  tier_gold: 'Gold Tier',
  tier_platinum: 'Platinum Tier',
  birthday_month: 'Birthday Month',
};

const TYPE_LABELS: Record<string, string> = {
  push: 'Push Notification',
  email: 'Email',
  inapp: 'In-App',
  sms: 'SMS',
};

export default async function CampaignResultsPage({
  params,
}: {
  params: { id: string };
}) {
  const t = await getTranslations('campaigns');
  const supabase = await createServerSupabaseClient();
  const tenant = await resolveAuthedTenant(supabase);
  if (!tenant) redirect('/login');

  const [campaign, metrics, notifications] = await Promise.all([
    getCampaignById(tenant.tenantId, params.id),
    getCampaignMetrics(tenant.tenantId, params.id),
    getCampaignNotifications(tenant.tenantId, params.id),
  ]);

  if (!campaign) notFound();

  const sentDate = campaign.sent_at
    ? new Date(campaign.sent_at).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  const chartData = [
    { name: t('metricDelivered'), value: metrics?.delivered ?? 0 },
    { name: 'Opened', value: metrics?.opened ?? 0 },
    { name: t('metricClicked'), value: metrics?.clicked ?? 0 },
    { name: 'Failed', value: (metrics?.recipients ?? 0) - (metrics?.delivered ?? 0) },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/campaigns"
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t('backToCampaigns')}
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
              <span>{TYPE_LABELS[campaign.type] ?? campaign.type}</span>
              <span>·</span>
              <span>{SEGMENT_LABELS[campaign.segment ?? ''] ?? campaign.segment ?? '—'}</span>
              <span>·</span>
              <span>{sentDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Recipients', value: metrics?.recipients?.toLocaleString() ?? '0' },
          { label: t('metricDelivered'), value: metrics?.delivered?.toLocaleString() ?? '0' },
          { label: t('metricOpenRate'), value: `${metrics?.openRate ?? 0}%` },
          { label: t('colRedemptions'), value: metrics?.redeemed?.toLocaleString() ?? '0' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">{t('notificationStatus')}</h2>
        <CampaignResultsChart data={chartData} />
      </div>

      {/* Notifications Table */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Recipients</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Member</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">{t('notificationStatus')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">{t('notificationOpened')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {notifications.map((n) => (
                <tr key={n.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{n.members?.name ?? '—'}</p>
                    <p className="text-xs text-gray-400">{n.members?.email ?? ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      n.status === 'sent' || n.status === 'delivered'
                        ? 'bg-green-100 text-green-700'
                        : n.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {n.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                    {n.opened_at
                      ? new Date(n.opened_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
