import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerUser } from '@/lib/supabase';
import { getMemberWithTenant, getMemberTransactions } from '@/lib/member/queries';
import { TransactionHistory } from '@/components/member/TransactionHistory';
import { BottomNav } from '@/components/member/BottomNav';
import { BrandTheme } from '@/components/member/BrandTheme';

export default async function HistoryPage() {
  const user = await getServerUser();
  if (!user) redirect('/login');

  const member = await getMemberWithTenant(user.id);
  if (!member) redirect('/login');

  const transactions = await getMemberTransactions(member.id, 50);

  return (
    <>
      <BrandTheme
        primary={member.tenant.brand_color_primary}
        secondary={member.tenant.brand_color_secondary}
      />

      <main className="pb-safe min-h-screen" style={{ background: 'var(--cream)' }}>
        {/* Sticky header */}
        <div
          className="sticky top-0 z-10 flex items-center gap-3 px-5 py-4"
          style={{ background: 'white', borderBottom: '1px solid var(--border)' }}
        >
          <Link href="/" className="border-0 bg-transparent cursor-pointer p-0">
            <svg
              width="22"
              height="22"
              fill="none"
              viewBox="0 0 24 24"
              stroke="var(--sage-dark)"
              strokeWidth="1.8"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div>
            <h1 className="font-display text-xl font-normal" style={{ color: 'var(--text)' }}>
              Historial
            </h1>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Todos tus movimientos de puntos
            </p>
          </div>
        </div>

        <div className="px-5 py-4">
          <TransactionHistory transactions={transactions} />
        </div>
      </main>

      <BottomNav />
    </>
  );
}
