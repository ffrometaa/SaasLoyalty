import { notFound, redirect } from 'next/navigation';
import { getServerUser } from '@/lib/supabase';
import { getMemberWithTenant, getRewardById } from '@/lib/member/queries';
import { cookies } from 'next/headers';
import { RewardDetail } from '@/components/member/RewardDetail';
import { BrandTheme } from '@/components/member/BrandTheme';

interface RewardPageProps {
  params: Promise<{ rewardId: string }>;
}

export default async function RewardPage({ params }: RewardPageProps) {
  const { rewardId } = await params;

  const user = await getServerUser();
  if (!user) redirect('/login');

  const tenantId = (await cookies()).get('loyalty_tenant_id')?.value;
  const [member, reward] = await Promise.all([
    getMemberWithTenant(user.id, tenantId),
    getRewardById(rewardId),
  ]);

  if (!member) redirect('/login');
  if (!reward) notFound();

  // Ensure reward belongs to member's tenant
  if (reward.tenant_id !== member.tenant_id) notFound();

  return (
    <>
      <BrandTheme
        primary={member.tenant.brand_color_primary}
        secondary={member.tenant.brand_color_secondary}
      />
      <RewardDetail reward={reward} member={member} />
    </>
  );
}
