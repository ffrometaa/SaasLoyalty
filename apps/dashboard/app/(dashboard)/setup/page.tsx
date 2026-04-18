import { redirect } from 'next/navigation';
import { createServerSupabaseClient, getAuthedUser } from '@loyalty-os/lib/server';
import { SetupWizardClient } from './SetupWizardClient';

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ restart?: string }> }) {
  const user = await getAuthedUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('tenants')
    .select('setup_wizard_completed_at, setup_wizard_dismissed_at, business_name, brand_color_primary, points_per_dollar, welcome_bonus_points, plan')
    .eq('auth_user_id', user.id)
    .single();

  if (!data) redirect('/');

  const isCompleted = !!data.setup_wizard_completed_at;
  const isForceRestart = params.restart === '1';

  if (isCompleted && !isForceRestart) redirect('/');

  return (
    <SetupWizardClient
      prefill={{
        businessName: data.business_name ?? '',
        primaryColor: data.brand_color_primary ?? '#7c3aed',
        pointsPerDollar: data.points_per_dollar ?? 1,
        welcomeBonusPoints: data.welcome_bonus_points ?? 100,
        plan: data.plan ?? 'starter',
      }}
    />
  );
}
