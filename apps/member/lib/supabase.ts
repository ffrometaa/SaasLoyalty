import { createServerSupabaseClient, createServiceRoleClient } from '@loyalty-os/lib/server';

// Re-export for convenience
export { createServerSupabaseClient, createServiceRoleClient };

/**
 * Get the authenticated server-side user.
 * Wraps supabase.auth.getUser() with explicit typing to work around
 * @supabase/ssr 0.5.x TypeScript inference issue.
 */
export async function getServerUser(): Promise<{ id: string; email?: string } | null> {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Narrow Supabase User type to the fields used by the app
  return user as { id: string; email?: string } | null;
}
