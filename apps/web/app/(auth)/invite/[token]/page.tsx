import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { InvitePageClient } from './InvitePageClient';

interface InviteInfo {
  id: string;
  email: string;
  role: string;
  businessName: string;
}

interface RawInviteRow {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  tenants: { business_name: string } | null;
}

export default async function InviteTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<JSX.Element> {
  const { token } = await params;

  let invite: InviteInfo | null = null;
  let inviteError: string | null = null;

  try {
    // Service role required: public-facing invite lookup — no authenticated session exists yet
    const service = createServiceRoleClient();
    const { data, error } = await service
      .from('invitations')
      .select('id, email, role, status, expires_at, tenants:tenant_id(business_name)')
      .eq('token', token)
      .returns<RawInviteRow[]>()
      .single();

    if (error || !data) {
      inviteError = 'Invitation not found';
    } else if (data.status !== 'pending') {
      inviteError = 'This invitation has already been used or revoked';
    } else if (new Date(data.expires_at) < new Date()) {
      // Service role required: marking expired invitations — bypasses RLS by design
      await service.from('invitations').update({ status: 'expired' }).eq('id', data.id);
      inviteError = 'This invitation has expired';
    } else {
      invite = {
        id: data.id,
        email: data.email,
        role: data.role,
        businessName: data.tenants?.business_name ?? '',
      };
    }
  } catch {
    inviteError = 'Failed to load invitation';
  }

  return (
    <InvitePageClient
      token={token}
      initialInvite={invite}
      initialError={inviteError}
    />
  );
}
