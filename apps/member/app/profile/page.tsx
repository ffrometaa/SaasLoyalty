import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/supabase';
import { getMemberWithTenant } from '@/lib/member/queries';
import { ProfileClient } from '@/components/member/ProfileClient';
import { BottomNav } from '@/components/member/BottomNav';
import { BrandTheme } from '@/components/member/BrandTheme';

export default async function ProfilePage() {
  const user = await getServerUser();
  if (!user) redirect('/login');

  const member = await getMemberWithTenant(user.id);
  if (!member) redirect('/login');

  return (
    <>
      <BrandTheme
        primary={member.tenant.brand_color_primary}
        secondary={member.tenant.brand_color_secondary}
      />
      <ProfileClient
        name={member.name}
        email={member.email ?? ''}
        memberCode={member.member_code}
        tier={member.tier}
        pointsBalance={member.points_balance}
        pointsLifetime={member.points_lifetime}
      />
      <BottomNav />
    </>
  );
}
