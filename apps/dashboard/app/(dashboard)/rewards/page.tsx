import { createServiceRoleClient, getAuthedUser } from '@loyalty-os/lib/server';
import { RewardsPageClient } from './RewardsPageClient';

interface Reward {
  id: string;
  name: string;
  description: string | null;
  points_required: number;
  redemption_count: number;
  is_active: boolean;
  max_redemptions: number | null;
  valid_until: string | null;
  created_at: string;
}

export default async function RewardsPage(): Promise<JSX.Element> {
  const user = await getAuthedUser();

  let initialRewards: Reward[] = [];

  if (user) {
    // Service role required: initial rewards fetch for Server Component — no session available at server render time
    const service = createServiceRoleClient();

    const { data: ownerTenant, error: ownerError } = await service
      .from('tenants')
      .select('id')
      .eq('auth_user_id', user.id)
      .is('deleted_at', null)
      .single();
    if (ownerError) console.error('[RewardsPage] tenant lookup error:', ownerError);

    let tenantId: string | null = ownerTenant?.id ?? null;

    if (!tenantId) {
      const { data: staffRecord, error: staffError } = await service
        .from('tenant_users')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single();
      if (staffError) console.error('[RewardsPage] staff lookup error:', staffError);
      tenantId = staffRecord?.tenant_id ?? null;
    }

    if (tenantId) {
      const { data: rewards, error } = await service
        .from('rewards')
        .select('*')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .returns<Reward[]>();

      if (!error && rewards) {
        initialRewards = rewards;
      }
    }
  }

  return <RewardsPageClient initialRewards={initialRewards} />;
}
