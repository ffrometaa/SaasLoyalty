import { createServerSupabaseClient } from '@loyalty-os/lib/server';
import { redirect } from 'next/navigation';
import SegmentBuilder from '../../../../../components/dashboard/SegmentBuilder';

async function assertAuthed(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { session } } = await (supabase.auth as any).getSession();
  if (!session?.user) return false;
  const { data: ownerTenant } = await supabase.from('tenants').select('id')
    .eq('auth_user_id', session.user.id).is('deleted_at', null).single();
  if (ownerTenant?.id) return true;
  const { data: staffRecord } = await supabase.from('tenant_users').select('tenant_id')
    .eq('auth_user_id', session.user.id).single();
  return !!staffRecord?.tenant_id;
}

export default async function NewSegmentPage() {
  const supabase = await createServerSupabaseClient();
  const authed = await assertAuthed(supabase);
  if (!authed) redirect('/login');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">New segment</h1>
        <p className="text-sm text-gray-500 mt-1">Define the conditions that members must meet to be included.</p>
      </div>
      <SegmentBuilder />
    </div>
  );
}
