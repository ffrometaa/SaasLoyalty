import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient, getAuthedUser } from '@loyalty-os/lib/server';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createServerSupabaseClient();
    const service = createServiceRoleClient();

    const { businessName } = await request.json();

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, business_name, owner_email')
      .eq('auth_user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    // Require exact business name match as confirmation
    if (tenant.business_name !== businessName) {
      return NextResponse.json({ error: 'Business name does not match' }, { status: 400 });
    }

    // Soft-delete the tenant — hard-delete happens after 30 days via cron
    await service
      .from('tenants')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', tenant.id);

    // Send confirmation email
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (RESEND_API_KEY && tenant.owner_email) {
      const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'LoyaltyOS <noreply@loyalbase.dev>',
          to: tenant.owner_email,
          subject: 'Your LoyaltyOS account has been closed',
          html: `<p>Hi ${tenant.business_name},</p>
<p>We've received your request to close your LoyaltyOS account. Your account is now deactivated.</p>
<p><strong>Your data will be permanently deleted on ${deletionDate}.</strong> Until then, you can contact <a href="mailto:support@loyalbase.dev">support@loyalbase.dev</a> to reactivate your account.</p>
<p>To export your data before deletion, please reply to this email and we'll send you a full CSV export within 24 hours.</p>
<p>Thank you for using LoyaltyOS.</p>`,
        }),
      });

      // Internal alert
      const INTERNAL_EMAIL = process.env.INTERNAL_ALERT_EMAIL || 'alerts@loyalbase.dev';
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'LoyaltyOS Alerts <noreply@loyalbase.dev>',
          to: INTERNAL_EMAIL,
          subject: `[CHURN] Account closed: ${tenant.business_name}`,
          html: `<p>Tenant <strong>${tenant.business_name}</strong> (${tenant.owner_email}) closed their account via self-service.</p>
<p>Hard-deletion scheduled for ${deletionDate}.</p>`,
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
