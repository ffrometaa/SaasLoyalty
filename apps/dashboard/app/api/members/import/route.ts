import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@loyalty-os/lib/server';
import { requireMemberSlot } from '../../../../lib/plans/guardFeature';

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

// POST /api/members/import - Bulk import members from CSV
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { session } } = await (supabase.auth as any).getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve tenantId: owner first, then staff
    const { data: ownerTenant } = await supabase
      .from('tenants')
      .select('id, slug')
      .eq('auth_user_id', session.user.id)
      .is('deleted_at', null)
      .single();

    let tenantId: string | null = ownerTenant?.id ?? null;
    let slug: string | null = ownerTenant?.slug ?? null;

    if (!tenantId) {
      const { data: staffRecord } = await supabase
        .from('tenant_users')
        .select('tenant_id, tenants(id, slug)')
        .eq('auth_user_id', session.user.id)
        .single();

      if (staffRecord) {
        tenantId = staffRecord.tenant_id ?? null;
        const tenantData = staffRecord.tenants as any;
        slug = tenantData?.slug ?? null;
      }
    }

    if (!tenantId || !slug) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const csvText = await request.text();
    const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean);

    // Skip header row
    const dataLines = lines.slice(1);

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      const parts = line.split(',');
      const name = unquote(parts[0] ?? '');
      const email = unquote(parts[1] ?? '');
      const phone = unquote(parts[2] ?? '') || null;

      const rowLabel = `Row ${i + 2}`; // +2 because we skipped header

      if (!name || !email) {
        errors.push(`${rowLabel}: name and email are required`);
        skipped++;
        continue;
      }

      // Enforce plan limit before each insert
      try {
        await requireMemberSlot(tenantId);
      } catch (limitError: unknown) {
        const message = limitError instanceof Error ? limitError.message : 'Member limit reached';
        errors.push(`${rowLabel}: ${message} — import stopped`);
        break;
      }

      const memberCode = `${slug.toUpperCase()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;

      const { error: insertError } = await supabase
        .from('members')
        .insert({
          tenant_id: tenantId,
          name,
          email,
          phone,
          member_code: memberCode,
          tier: 'bronze',
          points_balance: 0,
          points_lifetime: 0,
          visits_total: 0,
          status: 'active',
        });

      if (insertError) {
        // Handle duplicate email (unique constraint violation)
        if (insertError.code === '23505') {
          errors.push(`${rowLabel}: email '${email}' already exists — skipped`);
        } else {
          errors.push(`${rowLabel}: failed to insert — ${insertError.message}`);
        }
        skipped++;
        continue;
      }

      imported++;
    }

    return NextResponse.json({ imported, skipped, errors });
  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
