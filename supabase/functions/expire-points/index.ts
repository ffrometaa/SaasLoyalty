// Expire stale points for members who haven't visited in X days
// Runs daily at 00:05 UTC via pg_cron
//
// Logic:
//   For each active tenant with points_expiration_days > 0:
//     Find members with points_balance > 0 whose last_visit_at is older
//     than (now - points_expiration_days). Expire their full balance.
//
// Idempotency: skips members who already have an 'expire' transaction today.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Validate CRON_SECRET
  const authHeader = req.headers.get('Authorization') ?? '';
  const secret = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const started = Date.now();
  const now = new Date();
  const todayStart = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()).toISOString();

  let totalExpired = 0;
  let totalPointsExpired = 0;
  const errors: string[] = [];

  try {
    // Fetch all active tenants with a positive expiration window
    const { data: tenants, error: tenantErr } = await supabase
      .from('tenants')
      .select('id, business_name, points_expiration_days')
      .in('plan_status', ['active', 'trialing'])
      .gt('points_expiration_days', 0)
      .is('deleted_at', null);

    if (tenantErr) throw tenantErr;

    for (const tenant of tenants ?? []) {
      const cutoff = new Date(now.getTime() - tenant.points_expiration_days * 86400000).toISOString();

      // Find members eligible for expiration (positive balance, inactive since cutoff)
      const { data: eligibleMembers, error: membersErr } = await supabase
        .from('members')
        .select('id, points_balance')
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')
        .gt('points_balance', 0)
        .or(`last_visit_at.lt.${cutoff},last_visit_at.is.null`)
        .is('deleted_at', null);

      if (membersErr) {
        errors.push(`tenant ${tenant.id}: ${membersErr.message}`);
        continue;
      }

      if (!eligibleMembers || eligibleMembers.length === 0) continue;

      // Idempotency: fetch members who already had points expired today
      const eligibleIds = eligibleMembers.map((m: { id: string }) => m.id);
      const { data: alreadyExpired } = await supabase
        .from('transactions')
        .select('member_id')
        .eq('tenant_id', tenant.id)
        .eq('type', 'expire')
        .in('member_id', eligibleIds)
        .gte('created_at', todayStart);

      const alreadyExpiredSet = new Set(
        (alreadyExpired ?? []).map((t: { member_id: string }) => t.member_id)
      );

      const toExpire = eligibleMembers.filter(
        (m: { id: string }) => !alreadyExpiredSet.has(m.id)
      );

      if (toExpire.length === 0) continue;

      // Process each member
      for (const member of toExpire) {
        const pointsToExpire = member.points_balance as number;

        // Create expire transaction
        const { error: txErr } = await supabase.from('transactions').insert({
          tenant_id: tenant.id,
          member_id: member.id,
          type: 'expire',
          points: -pointsToExpire,
          balance_after: 0,
          description: `Points expired after ${tenant.points_expiration_days} days of inactivity`,
          reference_id: null,
        });

        if (txErr) {
          errors.push(`member ${member.id}: ${txErr.message}`);
          continue;
        }

        // Zero out the balance
        const { error: updateErr } = await supabase
          .from('members')
          .update({ points_balance: 0, updated_at: now.toISOString() })
          .eq('id', member.id);

        if (updateErr) {
          errors.push(`balance update ${member.id}: ${updateErr.message}`);
          continue;
        }

        totalExpired++;
        totalPointsExpired += pointsToExpire;
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log(
    `expire-points: ${totalExpired} members, ${totalPointsExpired} points expired in ${Date.now() - started}ms`
  );

  return new Response(
    JSON.stringify({
      ok: true,
      membersExpired: totalExpired,
      pointsExpired: totalPointsExpired,
      durationMs: Date.now() - started,
      errors,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
