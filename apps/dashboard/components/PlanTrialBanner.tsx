import Link from 'next/link';
import { createServerSupabaseClient, getAuthedUser } from '@loyalty-os/lib/server';

export async function PlanTrialBanner() {
  try {
    const user = await getAuthedUser();
    if (!user) return null;

    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from('tenants')
      .select('plan_status, trial_ends_at, is_founding_partner')
      .eq('auth_user_id', user.id)
      .single();

    if (!data) return null;
    if (data.plan_status !== 'trialing') return null;
    if (!data.trial_ends_at) return null;

    const daysRemaining = Math.ceil(
      (new Date(data.trial_ends_at).getTime() - Date.now()) / 86_400_000
    );
    const displayDays = Math.max(0, daysRemaining);
    const isUrgent = daysRemaining <= 3;
    const isFoundingPartner = data.is_founding_partner === true;

    const bannerStyle = isUrgent
      ? { background: 'linear-gradient(90deg, #7f1d1d, #b91c1c)', borderBottom: '1px solid #991b1b' }
      : { background: 'linear-gradient(90deg, #1e3a5f, #1e40af)', borderBottom: '1px solid #1e3a8a' };

    const urgentCopy = isUrgent
      ? `⚠️ Only ${displayDays} day${displayDays === 1 ? '' : 's'} left — upgrade now to keep your data and members.`
      : `${displayDays} day${displayDays === 1 ? '' : 's'} left in your trial.`;

    const foundingBadge = isFoundingPartner ? (
      <span className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-300 text-yellow-900">
        Founding Partner
      </span>
    ) : null;

    return (
      <div
        style={bannerStyle}
        className="w-full px-4 py-2 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-2 text-white text-sm">
          <span>
            {urgentCopy}
            {foundingBadge}
          </span>
        </div>
        <Link
          href="/settings?tab=billing"
          className="shrink-0 text-xs font-semibold px-3 py-1 rounded-full bg-white text-blue-900 hover:bg-blue-50 transition-colors"
        >
          Upgrade now →
        </Link>
      </div>
    );
  } catch {
    return null;
  }
}
