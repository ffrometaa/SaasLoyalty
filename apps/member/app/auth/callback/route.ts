import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@loyalty-os/lib/server';

function generateMemberCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirect') ?? '/';

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createServerSupabaseClient();

  // Exchange code for session
  const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

  if (sessionError || !sessionData.user) {
    console.error('Auth callback error:', sessionError);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const userId = sessionData.user.id;

  // Read tenant from cookie
  const cookieStore = await cookies();
  const tenantSlug = cookieStore.get('loyalty_tenant')?.value;

  if (!tenantSlug) {
    // No tenant context — redirect to root
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // Fetch tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .in('plan_status', ['trialing', 'active'])
    .single();

  if (!tenant) {
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // Check if member record already exists
  const { data: existingMember } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', userId)
    .eq('tenant_id', tenant.id)
    .single();

  if (!existingMember) {
    // Auto-create member on first login
    let memberCode = generateMemberCode();

    // Ensure code uniqueness (retry up to 3 times)
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: existing } = await supabase
        .from('members')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('member_code', memberCode)
        .single();

      if (!existing) break;
      memberCode = generateMemberCode();
    }

    const { error: insertError } = await supabase.from('members').insert({
      user_id: userId,
      tenant_id: tenant.id,
      tier: 'bronze',
      points_balance: 0,
      total_points_earned: 0,
      member_code: memberCode,
    });

    if (insertError) {
      console.error('Failed to create member record:', insertError);
    }
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
}
