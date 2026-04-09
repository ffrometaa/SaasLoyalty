// POST  /api/auth/impersonate  — start impersonation session (super admin only)
// DELETE /api/auth/impersonate — end impersonation session (mark ended_at in log)

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getAuthedUser } from '@loyalty-os/lib/server';
import crypto from 'crypto';

// ─── JWT helpers (no extra deps — use Node.js crypto) ────────────────────────

function base64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function signJWT(payload: Record<string, unknown>, secret: string): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body   = base64url(JSON.stringify(payload));
  const data   = `${header}.${body}`;
  const sig    = base64url(crypto.createHmac('sha256', secret).update(data).digest());
  return `${data}.${sig}`;
}

function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(Buffer.from(parts[1]!, 'base64url').toString());
  } catch {
    return null;
  }
}

// ─── POST /api/auth/impersonate ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate caller
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = createServiceRoleClient();

    // 2. Verify super admin (must be in super_admins table and active)
    const { data: superAdmin } = await service
      .from('super_admins')
      .select('id, email, full_name')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!superAdmin) {
      return NextResponse.json({ error: 'Forbidden: super admin access required' }, { status: 403 });
    }

    const body = await request.json() as {
      targetType: 'tenant' | 'member';
      targetId: string;
      reason?: string;
    };
    const { targetType, targetId, reason } = body;

    if (!targetType || !targetId) {
      return NextResponse.json({ error: 'Missing targetType or targetId' }, { status: 400 });
    }

    // 3. Resolve target
    let targetAuthUserId: string;
    let targetTenantId: string;
    let targetEmail: string;
    let targetName: string;
    let impersonationLevel: 'super_admin_to_tenant' | 'super_admin_to_member';

    if (targetType === 'tenant') {
      const { data: tenant } = await service
        .from('tenants')
        .select('id, auth_user_id, business_name, plan_status')
        .eq('id', targetId)
        .is('deleted_at', null)
        .single();

      if (!tenant?.auth_user_id) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: authUser } = await (service.auth as any).admin.getUserById(tenant.auth_user_id);

      targetAuthUserId = tenant.auth_user_id;
      targetTenantId   = tenant.id;
      targetEmail      = authUser?.user?.email ?? '';
      targetName       = tenant.business_name;
      impersonationLevel = 'super_admin_to_tenant';

    } else if (targetType === 'member') {
      const { data: member } = await service
        .from('members')
        .select('id, auth_user_id, tenant_id, email, name, status')
        .eq('id', targetId)
        .single();

      if (!member?.auth_user_id) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
      }
      if (member.status !== 'active') {
        return NextResponse.json({ error: 'Cannot impersonate inactive member' }, { status: 400 });
      }

      targetAuthUserId = member.auth_user_id;
      targetTenantId   = member.tenant_id;
      targetEmail      = member.email;
      targetName       = member.name;
      impersonationLevel = 'super_admin_to_member';

    } else {
      return NextResponse.json({ error: 'Invalid targetType — must be "tenant" or "member"' }, { status: 400 });
    }

    // 4. Generate impersonation JWT (15 min)
    const expiresIn = 900;
    const now       = Math.floor(Date.now() / 1000);
    const payload   = {
      sub:                targetAuthUserId,
      aud:                'authenticated',
      role:               'authenticated',
      email:              targetEmail,
      tenant_id:          targetTenantId,
      impersonated_by:    user.id,
      impersonation_level: impersonationLevel,
      iat:                now,
      exp:                now + expiresIn,
    };

    const jwtSecret  = process.env.SUPABASE_JWT_SECRET!;
    const accessToken = signJWT(payload, jwtSecret);

    // 5. Hash token for audit (never store raw tokens)
    const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');

    // 6. Request metadata
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? 'unknown';
    const ua = request.headers.get('user-agent') ?? 'unknown';

    // 7. Audit: impersonation_logs
    await service.from('impersonation_logs').insert({
      super_admin_id:      superAdmin.id,
      target_auth_user_id: targetAuthUserId,
      target_tenant_id:    targetTenantId,
      target_member_id:    targetType === 'member' ? targetId : null,
      impersonation_level: impersonationLevel,
      token_hash:          tokenHash,
      ip_address:          ip,
      user_agent:          ua,
      reason:              reason ?? null,
    });

    // 8. Audit: platform_events
    await service.from('platform_events').insert({
      admin_id:    superAdmin.id,
      action_type: 'impersonation_started',
      target_type: targetType,
      target_id:   targetId,
      metadata: {
        impersonation_level: impersonationLevel,
        target_email:        targetEmail,
        target_name:         targetName,
        reason:              reason ?? null,
      },
    });

    // 9. Member activity log (only for member impersonation)
    if (targetType === 'member') {
      await service.from('member_activity_log').insert({
        member_id:     targetId,
        tenant_id:     targetTenantId,
        action:        'IMPERSONATION_STARTED',
        resource_type: 'SYSTEM',
        details: {
          impersonated_by: user.id,
          admin_email:     superAdmin.email,
          reason:          reason ?? null,
          timestamp:       new Date().toISOString(),
        },
        ip_address: ip,
        user_agent: ua,
      });
    }

    return NextResponse.json({
      accessToken,
      targetId,
      targetType,
      targetEmail,
      targetName,
      targetTenantId,
      impersonationLevel,
      expiresIn,
    });

  } catch (err) {
    console.error('[impersonate POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── DELETE /api/auth/impersonate ─────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await request.json() as { token: string };
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const decoded = decodeJWT(token);
    if (!decoded?.impersonated_by) {
      return NextResponse.json({ error: 'Not an impersonation token' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const service   = createServiceRoleClient();

    // Mark ended
    await service
      .from('impersonation_logs')
      .update({ ended_at: new Date().toISOString() })
      .eq('token_hash', tokenHash);

    // Member activity log if it was a member session
    if (decoded.impersonation_level === 'super_admin_to_member' && decoded.sub) {
      const { data: member } = await service
        .from('members')
        .select('id, tenant_id')
        .eq('auth_user_id', decoded.sub as string)
        .single();

      if (member) {
        await service.from('member_activity_log').insert({
          member_id:     member.id,
          tenant_id:     member.tenant_id,
          action:        'IMPERSONATION_ENDED',
          resource_type: 'SYSTEM',
          details: {
            duration_seconds: Math.floor(Date.now() / 1000) - (decoded.iat as number),
          },
        });
      }
    }

    return NextResponse.json({ ended: true });

  } catch (err) {
    console.error('[impersonate DELETE]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
