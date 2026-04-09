import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceRoleClient, getServerUser } from '@/lib/supabase';

const MEMBER_APP_URL = process.env.NEXT_PUBLIC_MEMBER_APP_URL ?? 'https://member.loyalbase.dev';

export async function GET() {
  try {
    const user = await getServerUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = cookies().get('loyalty_tenant_id')?.value;
    const db = createServiceRoleClient();

    // Get current member with referral info
    let memberQuery = db
      .from('members')
      .select('id, tenant_id, referral_code')
      .eq('auth_user_id', user.id)
      .eq('status', 'active');

    if (tenantId) memberQuery = memberQuery.eq('tenant_id', tenantId);

    const { data: member } = await memberQuery.limit(1).maybeSingle();

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Get tenant referral config
    const { data: tenant } = await db
      .from('tenants')
      .select('referral_enabled, referral_points_referrer, referral_points_referee, business_name')
      .eq('id', member.tenant_id)
      .single();

    const referralUrl = member.referral_code
      ? `${MEMBER_APP_URL}/join?ref=${member.referral_code}`
      : null;

    // Get referred members list
    const { data: referrals } = await db
      .from('members')
      .select('id, name, visits_total, created_at')
      .eq('tenant_id', member.tenant_id)
      .eq('referred_by', member.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // Count points earned from referrals
    const { data: referralTx } = await db
      .from('transactions')
      .select('points')
      .eq('tenant_id', member.tenant_id)
      .eq('member_id', member.id)
      .eq('type', 'referral');

    const pointsEarned = (referralTx ?? []).reduce(
      (sum: number, t: { points: number }) => sum + t.points,
      0,
    );

    return NextResponse.json({
      referralCode: member.referral_code,
      referralUrl,
      enabled: tenant?.referral_enabled ?? false,
      pointsForReferrer: tenant?.referral_points_referrer ?? 50,
      pointsForReferee: tenant?.referral_points_referee ?? 50,
      businessName: tenant?.business_name ?? '',
      pointsEarned,
      referrals: (referrals ?? []).map((r: { id: string; name: string; visits_total: number; created_at: string }) => ({
        id: r.id,
        name: r.name,
        hasVisited: r.visits_total > 0,
        joinedAt: r.created_at,
      })),
    });
  } catch (err) {
    console.error('Referrals API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
