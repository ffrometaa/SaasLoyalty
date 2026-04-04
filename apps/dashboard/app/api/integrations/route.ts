import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@loyalty-os/lib/server';

function generateApiKey(): string {
  return `llo_${crypto.randomUUID().replace(/-/g, '')}`;
}

// GET /api/integrations - Get integration settings (api_key, join URL, widget URL)
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { session } } = await (supabase.auth as any).getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Owner only — api_key is sensitive
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, slug, api_key')
      .eq('auth_user_id', session.user.id)
      .is('deleted_at', null)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found or insufficient permissions' }, { status: 404 });
    }

    let apiKey = tenant.api_key as string | null;

    // Auto-generate api_key if not set yet
    if (!apiKey) {
      apiKey = generateApiKey();
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ api_key: apiKey })
        .eq('id', tenant.id);

      if (updateError) {
        console.error('Error saving generated api_key:', updateError);
        return NextResponse.json({ error: 'Failed to generate API key' }, { status: 500 });
      }
    }

    const slug = tenant.slug as string;
    const memberAppBase = process.env.NEXT_PUBLIC_MEMBER_APP_URL ?? 'https://member.loyalbase.dev';
    const joinUrl = `${memberAppBase}/join/${slug}`;
    const widgetUrl = `${memberAppBase}/join/${slug}?embed=true`;

    return NextResponse.json({ apiKey, slug, joinUrl, widgetUrl });
  } catch (error) {
    console.error('Integrations GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/integrations - Regenerate api_key
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { session } } = await (supabase.auth as any).getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Owner only
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('auth_user_id', session.user.id)
      .is('deleted_at', null)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found or insufficient permissions' }, { status: 404 });
    }

    const newApiKey = generateApiKey();

    const { error: updateError } = await supabase
      .from('tenants')
      .update({ api_key: newApiKey })
      .eq('id', tenant.id);

    if (updateError) {
      console.error('Error regenerating api_key:', updateError);
      return NextResponse.json({ error: 'Failed to regenerate API key' }, { status: 500 });
    }

    return NextResponse.json({ apiKey: newApiKey });
  } catch (error) {
    console.error('Integrations POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
