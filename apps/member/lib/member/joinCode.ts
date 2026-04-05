/**
 * Join Code utilities for the member registration flow.
 *
 * lookupTenantByJoinCode — queries the tenant_public_info view by code
 * validateJoinCode       — boolean check for real-time field validation
 * generateMemberCodePreview — client-side preview of the member code format
 */

import { getSupabaseClient } from '@loyalty-os/lib';

export type TenantPublicInfo = {
  id: string;
  business_name: string;
  brand_logo_url: string | null;
  brand_app_name: string | null;
  brand_color_primary: string;
  brand_color_secondary: string | null;
  join_code: string;
  slug: string;
};

/**
 * Look up a tenant by its 6-character join code.
 * Normalises the code (trim + uppercase) before querying.
 * Returns null if the code is not found or the tenant is not active/trialing
 * (the view already filters inactive tenants).
 */
export async function lookupTenantByJoinCode(raw: string): Promise<TenantPublicInfo | null> {
  const code = raw.trim().toUpperCase();
  if (code.length !== 6) return null;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('tenant_public_info')
    .select('id, business_name, brand_logo_url, brand_app_name, brand_color_primary, brand_color_secondary, join_code, slug')
    .eq('join_code', code)
    .maybeSingle();

  if (error || !data) return null;
  return data as TenantPublicInfo;
}

/**
 * Returns true if the given code maps to an active tenant, false otherwise.
 * Intended for real-time field validation after 6 characters are entered.
 */
export async function validateJoinCode(raw: string): Promise<boolean> {
  const result = await lookupTenantByJoinCode(raw);
  return result !== null;
}

/**
 * Client-side preview of what a member code will look like.
 * Actual member codes are generated server-side; this is for display only.
 * Format: first 3 letters of business name (uppercase) + "-" + 5-digit sequence
 * Example: SPA-00042
 */
export function generateMemberCodePreview(businessName: string, sequence: number): string {
  const prefix = businessName
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3)
    .padEnd(3, 'X');
  const seq = String(sequence).padStart(5, '0');
  return `${prefix}-${seq}`;
}
