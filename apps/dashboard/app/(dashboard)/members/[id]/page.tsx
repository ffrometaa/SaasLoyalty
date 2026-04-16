import { createServiceRoleClient, getAuthedUser } from '@loyalty-os/lib/server';
import { MemberDetailPageClient } from './MemberDetailPageClient';
import type { MemberDetail } from './MemberDetailPageClient';

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<JSX.Element> {
  const { id } = await params;
  const user = await getAuthedUser();

  let initialMember: MemberDetail | null = null;

  if (user) {
    // Service role required: initial member detail fetch for Server Component — no session available at server render time
    const service = createServiceRoleClient();

    const { data: ownerTenant, error: ownerError } = await service
      .from('tenants')
      .select('id')
      .eq('auth_user_id', user.id)
      .is('deleted_at', null)
      .single();
    if (ownerError) console.error('[MemberDetailPage] tenant lookup error:', ownerError);

    let tenantId: string | null = ownerTenant?.id ?? null;

    if (!tenantId) {
      const { data: staffRecord, error: staffError } = await service
        .from('tenant_users')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single();
      if (staffError) console.error('[MemberDetailPage] staff lookup error:', staffError);
      tenantId = staffRecord?.tenant_id ?? null;
    }

    if (tenantId) {
      const { data: member, error: memberError } = await service
        .from('members')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .returns<Omit<MemberDetail, 'transactions'>>()
        .single();

      if (memberError) console.error('[MemberDetailPage] member query error:', memberError);

      if (member) {
        const { data: transactions, error: transactionError } = await service
          .from('transactions')
          .select('id, type, points, points_balance, description, created_at')
          .eq('member_id', id)
          .order('created_at', { ascending: false })
          .limit(50);
        if (transactionError) console.error('[MemberDetailPage] transactions query error:', transactionError);

        initialMember = {
          ...member,
          transactions: transactions ?? [],
        } satisfies MemberDetail;
      }
    }
  }

  return <MemberDetailPageClient initialMember={initialMember} memberId={id} />;
}
