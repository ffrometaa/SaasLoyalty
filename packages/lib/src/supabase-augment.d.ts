/**
 * Module augmentation: restore SupabaseAuthClient methods.
 *
 * @supabase/auth-js@2.101.1 ships "exports": null in package.json.
 * With moduleResolution: "bundler", TypeScript can't resolve AuthClient's
 * declarations, so SupabaseAuthClient loses all inherited methods.
 * This augmentation restores them via interface merging.
 *
 * TODO: Remove when @supabase/auth-js fixes "exports" in a future release.
 */
import type { GoTrueClient } from '@supabase/auth-js';

declare module '@supabase/supabase-js' {
  interface SupabaseAuthClient extends GoTrueClient {}
}
