import type { User, GoTrueAdminApi } from '@supabase/supabase-js';

declare module '@supabase/supabase-js' {
  interface SupabaseAuthClient {
    getUser(jwt?: string): Promise<{ data: { user: User | null }; error: Error | null }>;
    admin: GoTrueAdminApi;
  }
}

export { createServerSupabaseClient, createServiceRoleClient, getAuthedUser } from './supabase-server';

// Re-export getPlatformEmailConfig with server-only restriction
import { createServiceRoleClient } from './supabase-server';

/**
 * Returns platform email branding from platform_config.
 * Use this in route handlers instead of hardcoding 'LoyaltyOS <noreply@loyalbase.dev>'.
 *
 * @example
 * const { from } = await getPlatformEmailConfig();
 * // → 'LoyaltyOS <noreply@loyalbase.dev>'
 */
export async function getPlatformEmailConfig(): Promise<{ fromName: string; fromAddress: string; from: string }> {
  const service = createServiceRoleClient();

  const { data } = await service
    .from('platform_config')
    .select('email_from_name, email_from_address')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single();

  const fromName = data?.email_from_name ?? 'LoyaltyOS';
  const fromAddress = data?.email_from_address ?? 'noreply@loyalbase.dev';

  return { fromName, fromAddress, from: `${fromName} <${fromAddress}>` };
}
