import Link from 'next/link';
import { createServerSupabaseClient, getAuthedUser } from '@loyalty-os/lib/server';

export async function SuperAdminBanner() {
  try {
    const user = await getAuthedUser();
    if (!user) return null;

    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!data) return null;

    return (
      <div
        style={{
          background: 'linear-gradient(90deg, #92400e, #b45309)',
          borderBottom: '1px solid #a16207',
        }}
        className="w-full px-4 py-2 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-2 text-amber-100 text-sm">
          <svg className="w-4 h-4 shrink-0 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>
            <span className="font-semibold text-amber-200">Modo Demo</span>
            {' '}— Estás navegando el dashboard como tenant
          </span>
        </div>
        <Link
          href="/admin"
          className="shrink-0 text-xs font-semibold px-3 py-1 rounded-full bg-amber-200 text-amber-900 hover:bg-amber-100 transition-colors"
        >
          Ir al Super Admin →
        </Link>
      </div>
    );
  } catch {
    return null;
  }
}
