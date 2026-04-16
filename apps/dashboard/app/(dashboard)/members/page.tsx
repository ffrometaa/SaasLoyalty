import { createServiceRoleClient, getAuthedUser } from '@loyalty-os/lib/server';
import { MembersPageClient } from './MembersPageClient';
import type { MemberRow } from './MembersPageClient';

export default async function MembersPage(): Promise<JSX.Element> {
  const user = await getAuthedUser();

  let initialMembers: MemberRow[] = [];
  let initialTotal = 0;

  if (user) {
    // Service role required: initial members fetch for Server Component — no session available at server render time
    const service = createServiceRoleClient();

    const { data: ownerTenant, error: ownerError } = await service
      .from('tenants')
      .select('id')
      .eq('auth_user_id', user.id)
      .is('deleted_at', null)
      .single();
    if (ownerError) console.error('[MembersPage] tenant lookup error:', ownerError);

    let tenantId: string | null = ownerTenant?.id ?? null;

    if (!tenantId) {
      const { data: staffRecord, error: staffError } = await service
        .from('tenant_users')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single();
      if (staffError) console.error('[MembersPage] staff lookup error:', staffError);
      tenantId = staffRecord?.tenant_id ?? null;
    }

    if (tenantId) {
      const { data: members, count, error } = await service
        .from('members')
        .select('id, name, email, member_code, points_balance, tier, status, last_visit_at, auth_user_id', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(0, 19)
        .returns<MemberRow[]>();

      if (!error && members) {
        initialMembers = members;
        initialTotal = count ?? 0;
      }
    }
  }

  return <MembersPageClient initialMembers={initialMembers} initialTotal={initialTotal} />;
}
