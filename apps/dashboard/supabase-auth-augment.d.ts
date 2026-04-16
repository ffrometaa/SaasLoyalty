/**
 * Module augmentation: restore SupabaseAuthClient methods for dashboard.
 * Mirror of packages/lib/src/supabase-augment.d.ts.
 *
 * Needed because triple-slash references in imported modules don't propagate
 * to the consuming project's compilation context.
 *
 * TODO: Remove when @supabase/auth-js fixes "exports": null.
 */
import type { GoTrueClient } from '@supabase/auth-js';

declare module '@supabase/supabase-js' {
  interface SupabaseAuthClient extends GoTrueClient {}
}
