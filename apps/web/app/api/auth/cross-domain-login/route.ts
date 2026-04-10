import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@loyalty-os/lib/server';

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.loyalbase.dev';

export async function GET(request: NextRequest) {
  // Read the session from cookies on loyalbase.dev
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user?.email) {
    return NextResponse.redirect(`${DASHBOARD_URL}/login`);
  }

  // Use service role to generate a magic link that creates a session on the dashboard domain
  const admin = createServiceRoleClient();
  const { data, error } = await (admin.auth as any).admin.generateLink({
    type: 'magiclink',
    email: user.email,
    options: {
      redirectTo: `${DASHBOARD_URL}/auth/callback?next=/`,
    },
  });

  if (error || !data.properties?.action_link) {
    console.error('Failed to generate cross-domain link:', error);
    return NextResponse.redirect(`${DASHBOARD_URL}/login`);
  }

  // Redirect through the magic link — this establishes a session on dashboard.loyalbase.dev
  return NextResponse.redirect(data.properties.action_link);
}
