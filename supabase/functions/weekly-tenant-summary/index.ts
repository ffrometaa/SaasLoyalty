// Weekly summary email to tenant owners
// Runs every Monday at 08:00 UTC via pg_cron
//
// Sends a summary of the last 7 days to each active tenant's owner email:
//   - New members this week
//   - Visits this week
//   - Points earned and redeemed
//   - Top redeemed reward

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const DASHBOARD_URL = Deno.env.get('DASHBOARD_URL') ?? 'https://dashboard.loyalbase.dev';

serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const authHeader = req.headers.get('Authorization') ?? '';
  const secret = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ ok: false, error: 'RESEND_API_KEY not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const started = Date.now();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  try {
    // Get all active tenants with owner info
    const { data: tenants, error: tenantErr } = await supabase
      .from('tenants')
      .select('id, business_name, auth_user_id, plan')
      .in('plan_status', ['active', 'trialing'])
      .is('deleted_at', null);

    if (tenantErr) throw tenantErr;

    for (const tenant of tenants ?? []) {
      if (!tenant.auth_user_id) { skipped++; continue; }

      // Get owner email via admin API
      const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(
        tenant.auth_user_id as string
      );
      if (userErr || !userData?.user?.email) { skipped++; continue; }

      const ownerEmail = userData.user.email;
      const businessName = tenant.business_name as string;

      // Gather weekly metrics in parallel
      const [
        { count: newMembers },
        { count: visitsThisWeek },
        { data: earnTx },
        { data: redeemTx },
        { data: topRewardData },
      ] = await Promise.all([
        supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .gte('created_at', weekAgo),
        supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .gte('created_at', weekAgo),
        supabase
          .from('transactions')
          .select('points')
          .eq('tenant_id', tenant.id)
          .eq('type', 'earn')
          .gte('created_at', weekAgo),
        supabase
          .from('transactions')
          .select('points')
          .eq('tenant_id', tenant.id)
          .eq('type', 'redeem')
          .gte('created_at', weekAgo),
        supabase
          .from('redemptions')
          .select('reward_id, rewards(name)')
          .eq('tenant_id', tenant.id)
          .eq('status', 'used')
          .gte('created_at', weekAgo),
      ]);

      const pointsEarned = (earnTx ?? []).reduce((s: number, t: { points: number }) => s + t.points, 0);
      const pointsRedeemed = (redeemTx ?? []).reduce((s: number, t: { points: number }) => s + Math.abs(t.points), 0);

      // Top reward this week
      const rewardCounts: Record<string, { name: string; count: number }> = {};
      for (const r of topRewardData ?? []) {
        const reward = r.rewards as { name: string } | null;
        if (reward && r.reward_id) {
          rewardCounts[r.reward_id] = rewardCounts[r.reward_id] ?? { name: reward.name, count: 0 };
          rewardCounts[r.reward_id].count++;
        }
      }
      const topReward = Object.values(rewardCounts).sort((a, b) => b.count - a.count)[0] ?? null;

      const html = buildWeeklySummaryEmail(businessName, {
        newMembers: newMembers ?? 0,
        visitsThisWeek: visitsThisWeek ?? 0,
        pointsEarned,
        pointsRedeemed,
        topReward,
        dashboardUrl: DASHBOARD_URL,
        weekStart: new Date(now.getTime() - 7 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weekEnd: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      });

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: 'LoyaltyOS <hello@loyalbase.dev>',
          to: [ownerEmail],
          subject: `Weekly Summary — ${businessName} 📊`,
          html,
        }),
      });

      const resJson = await res.json() as { id?: string };
      if (resJson.id) sent++;
      else errors.push(`tenant ${tenant.id}: email failed`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log(`weekly-tenant-summary: ${sent} sent, ${skipped} skipped in ${Date.now() - started}ms`);
  return new Response(
    JSON.stringify({ ok: true, sent, skipped, durationMs: Date.now() - started, errors }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});

function buildWeeklySummaryEmail(
  businessName: string,
  stats: {
    newMembers: number;
    visitsThisWeek: number;
    pointsEarned: number;
    pointsRedeemed: number;
    topReward: { name: string; count: number } | null;
    dashboardUrl: string;
    weekStart: string;
    weekEnd: string;
  },
): string {
  const { newMembers, visitsThisWeek, pointsEarned, pointsRedeemed, topReward, dashboardUrl, weekStart, weekEnd } = stats;

  const metricRow = (icon: string, label: string, value: string) => `
    <tr>
      <td style="padding:12px 0; border-bottom:1px solid #f1f5f9;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:32px; font-size:20px;">${icon}</td>
            <td style="font-size:15px; color:#374151;">${label}</td>
            <td style="text-align:right; font-size:18px; font-weight:700; color:#0f172a;">${value}</td>
          </tr>
        </table>
      </td>
    </tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">
        <tr>
          <td style="background-color:#1e1b4b; border-radius:12px 12px 0 0; padding:28px 40px;">
            <p style="margin:0 0 4px; font-size:13px; color:#a5b4fc; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Weekly Summary</p>
            <h1 style="margin:0 0 4px; font-size:24px; font-weight:800; color:#ffffff;">${businessName}</h1>
            <p style="margin:0; font-size:13px; color:#818cf8;">${weekStart} – ${weekEnd}</p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#ffffff; padding:36px 40px;">
            <h2 style="margin:0 0 20px; font-size:16px; font-weight:700; color:#374151; text-transform:uppercase; letter-spacing:0.5px;">This Week at a Glance</h2>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${metricRow('👥', 'New members', newMembers.toLocaleString())}
              ${metricRow('📍', 'Visits', visitsThisWeek.toLocaleString())}
              ${metricRow('⭐', 'Points earned', pointsEarned.toLocaleString())}
              ${metricRow('🎁', 'Points redeemed', pointsRedeemed.toLocaleString())}
              ${topReward ? metricRow('🏆', `Top reward: ${topReward.name}`, `${topReward.count}×`) : ''}
            </table>
            ${newMembers === 0 && visitsThisWeek === 0 ? `
            <div style="margin:24px 0 0; padding:16px; background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px;">
              <p style="margin:0; font-size:14px; color:#0369a1;">💡 <strong>Tip:</strong> Share your join link with customers to grow your loyalty program. Find it in Dashboard → Settings → Integrations.</p>
            </div>` : ''}
          </td>
        </tr>
        <tr>
          <td style="background-color:#f8fafc; padding:20px 40px; border-top:1px solid #e2e8f0; text-align:center; border-radius:0 0 12px 12px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
              <tr><td style="border-radius:8px; background-color:#7c3aed;">
                <a href="${dashboardUrl}/analytics" style="display:inline-block; padding:12px 24px; color:#ffffff; font-weight:700; font-size:14px; text-decoration:none; border-radius:8px;">View Full Analytics →</a>
              </td></tr>
            </table>
            <p style="margin:0; font-size:12px; color:#94a3b8;">LoyaltyOS LLC · West Palm Beach, FL, USA</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
