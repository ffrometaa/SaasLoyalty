import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { getInviteTokenRatelimit } from '@/lib/ratelimit';

interface RawInviteRow {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  tenant_id: string;
  invited_by: string;
  tenants: { business_name: string } | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  try {
    const inviteTokenLimiter = getInviteTokenRatelimit();
    if (inviteTokenLimiter) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        request.headers.get('x-real-ip') ?? '127.0.0.1';
      const { success, limit, reset } = await inviteTokenLimiter.limit(ip);
      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        return NextResponse.json({ error: 'Too many requests' }, {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(reset),
          },
        });
      }
    }
    const { token } = await params;
    // Service role required: invite token lookup without authenticated session — bypasses RLS
    const supabase = createServiceRoleClient();

    const { data: invite, error: inviteError } = await supabase
      .from('invitations')
      .select('id, email, role, status, expires_at, tenant_id, invited_by, tenants(business_name)')
      .eq('token', token)
      .returns<RawInviteRow>()
      .single();
    if (inviteError) console.error('[invite GET] invite lookup error:', inviteError);

    if (!invite) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'This invitation has already been used or revoked', status: invite.status }, { status: 410 });
    }

    if (new Date(invite.expires_at) < new Date()) {
      await supabase.from('invitations').update({ status: 'expired' }).eq('id', invite.id);
      return NextResponse.json({ error: 'This invitation has expired' }, { status: 410 });
    }

    return NextResponse.json({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      businessName: invite.tenants?.business_name ?? '',
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
