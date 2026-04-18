// Expire pending redemptions whose expires_at is in the past.
// Runs daily at 02:00 UTC via pg_cron.
//
// Logic:
//   UPDATE redemptions SET status = 'expired'
//   WHERE status = 'pending' AND expires_at < now()
//
// Idempotency: only rows that are still 'pending' are updated — re-runs are safe.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const secret = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const started = Date.now();

  const { error, count } = await supabase
    .from('redemptions')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString())
    .select('id', { count: 'exact', head: true });

  if (error) {
    console.error('expire-redemptions update error:', error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const expired = count ?? 0;
  console.log(`expire-redemptions: ${expired} rows expired in ${Date.now() - started}ms`);

  return new Response(
    JSON.stringify({ ok: true, expired, durationMs: Date.now() - started }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
