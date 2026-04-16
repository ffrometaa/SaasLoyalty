import type { SupabaseClient } from '@supabase/supabase-js';

export type TenantRole = 'owner' | 'staff';

interface RawTenantRow {
  id: string;
  business_name: string;
  slug: string;
  plan: string;
  plan_status: string;
  brand_logo_url: string | null;
  brand_color_primary: string | null;
  brand_color_secondary: string | null;
  stripe_customer_id: string | null;
  auth_user_id: string | null;
  created_at: string;
}

interface RawStaffRecord {
  role: string;
  tenants: RawTenantRow | null;
}

export interface TenantWithRole {
  tenant: RawTenantRow;
  role: TenantRole;
}

/**
 * Get the tenant for a user — works for both owners and staff members.
 * Owners are identified via tenants.auth_user_id.
 * Staff are identified via tenant_users.auth_user_id.
 */
export async function getTenantForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<TenantWithRole | null> {
  // 1. Check if user is the owner
  const { data: ownerTenant, error: ownerError } = await supabase
    .from('tenants')
    .select('*')
    .eq('auth_user_id', userId)
    .is('deleted_at', null)
    .single();
  if (ownerError) console.error('[getTenantForUser] owner lookup error:', ownerError);

  if (ownerTenant) {
    return { tenant: ownerTenant, role: 'owner' };
  }

  // 2. Check if user is a staff member
  const { data: staffRecord, error: staffError } = await supabase
    .from('tenant_users')
    .select('role, tenants(*)')
    .eq('auth_user_id', userId)
    .returns<RawStaffRecord>()
    .single();
  if (staffError) console.error('[getTenantForUser] staff lookup error:', staffError);

  if (staffRecord?.tenants) {
    return { tenant: staffRecord.tenants, role: staffRecord.role as TenantRole };
  }

  return null;
}
