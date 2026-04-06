// DELETE /api/auth/impersonate — end impersonation session (mark ended_at in log)

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import crypto from 'crypto';

function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(Buffer.from(parts[1]!, 'base64url').toString());
  } catch {
    return null;
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { token } = await request.json() as { token: string };

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const decoded = decodeJWT(token);
    if (!decoded?.impersonated_by) {
      return NextResponse.json({ error: 'Not an impersonation token' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const service = createServiceRoleClient();

    await service
      .from('impersonation_logs')
      .update({ ended_at: new Date().toISOString() })
      .eq('token_hash', tokenHash);

    if (decoded.impersonation_level === 'super_admin_to_member' && decoded.sub) {
      const { data: member } = await service
        .from('members')
        .select('id, tenant_id')
        .eq('auth_user_id', decoded.sub as string)
        .single();

      if (member) {
        await service.from('member_activity_log').insert({
          member_id: member.id,
          tenant_id: member.tenant_id,
          action: 'IMPERSONATION_ENDED',
          resource_type: 'SYSTEM',
          details: {
            duration_seconds: Math.floor(Date.now() / 1000) - (decoded.iat as number),
          },
        });
      }
    }

    return NextResponse.json({ ended: true });

  } catch (err) {
    console.error('[member impersonate DELETE]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
