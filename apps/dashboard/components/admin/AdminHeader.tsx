import { PlanPreviewBanner } from './PlanPreviewBanner';
import { getAdminPlanPreview } from '@/lib/admin/planPreview';
import { createServiceRoleClient } from '@loyalty-os/lib/server';

// Gets a count of tenants with plan_status = past_due or trial ending in < 3 days
async function getAtRiskCount() {
  try {
    const service = createServiceRoleClient();
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    const { count: pastDue } = await service
      .from('tenants')
      .select('id', { count: 'exact', head: true })
      .eq('plan_status', 'past_due')
      .is('deleted_at', null);

    const { count: trialEnding } = await service
      .from('tenants')
      .select('id', { count: 'exact', head: true })
      .eq('plan_status', 'trialing')
      .not('trial_ends_at', 'is', null)
      .lte('trial_ends_at', threeDaysFromNow)
      .is('deleted_at', null);

    return (pastDue ?? 0) + (trialEnding ?? 0);
  } catch {
    return 0;
  }
}

export async function AdminHeader({ admin = { id: '', full_name: '', email: '' }, title = null }) {
  const previewPlan = getAdminPlanPreview();
  const atRiskCount = await getAtRiskCount();

  return (
    <div className="sticky top-0 z-30">
      {previewPlan && <PlanPreviewBanner plan={previewPlan} />}
      <header className="bg-[#0a0a0f]/85 backdrop-blur-[12px] border-b border-white/[0.06] px-8 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">{title ?? 'Admin'}</h1>
        <div className="flex items-center gap-4">
          {/* At-risk notification bell */}
          <div className="relative">
            <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
            </button>
            {atRiskCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {atRiskCount > 9 ? '9+' : atRiskCount}
              </span>
            )}
          </div>

          {/* Admin avatar */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#7c3aed]/30 border border-[#7c3aed]/40 flex items-center justify-center">
              <span className="text-xs font-bold text-[#a78bfa]">
                {admin?.full_name?.charAt(0)?.toUpperCase() || admin?.email?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-white">{admin?.full_name || 'Admin'}</p>
              <p className="text-[11px] text-slate-500">{admin?.email}</p>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
