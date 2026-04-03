import type { TransactionItem, TransactionType } from '@/lib/member/types';

const TYPE_ICON: Record<TransactionType, string> = {
  earn: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  redeem: 'M12 8v13m0-13V6a4 4 0 014-4h1m-5 6H6a4 4 0 01-4-4V6a4 4 0 014-4h1',
  expire: 'M12 8v4l3 3M21 12A9 9 0 113 12a9 9 0 0118 0z',
  bonus: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  referral: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3.87-3.97M16 3.13a4 4 0 010 7.75',
  birthday: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  adjustment: 'M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z',
  refund: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6',
};

const TYPE_BG: Record<TransactionType, string> = {
  earn: 'var(--sage-light)',
  redeem: 'var(--clay-light)',
  expire: '#f5f5f5',
  bonus: 'var(--gold-light)',
  referral: 'var(--gold-light)',
  birthday: 'var(--sage-light)',
  adjustment: '#f5f5f5',
  refund: 'var(--sage-light)',
};

const TYPE_STROKE: Record<TransactionType, string> = {
  earn: 'var(--sage-dark)',
  redeem: 'var(--clay-dark)',
  expire: 'var(--muted)',
  bonus: 'var(--gold)',
  referral: 'var(--gold)',
  birthday: 'var(--sage-dark)',
  adjustment: 'var(--muted)',
  refund: 'var(--sage-dark)',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return `Hoy, ${date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`;
  }

  return date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

interface TransactionHistoryProps {
  transactions: TransactionItem[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-6" style={{ color: 'var(--muted)' }}>
        <p className="text-sm">Sin actividad reciente.</p>
      </div>
    );
  }

  return (
    <div>
      {transactions.map((tx, i) => {
        const isPlus = tx.points > 0;
        const icon = TYPE_ICON[tx.type] ?? TYPE_ICON.earn;
        const bg = TYPE_BG[tx.type] ?? 'var(--sage-light)';
        const stroke = TYPE_STROKE[tx.type] ?? 'var(--sage-dark)';

        return (
          <div
            key={tx.id}
            className="flex items-center gap-3 py-3"
            style={{
              borderTop: i === 0 ? 'none' : '1px solid var(--border)',
            }}
          >
            {/* Icon */}
            <div
              className="w-[38px] h-[38px] rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: bg }}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth="1.8">
                <path d={icon} />
              </svg>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium truncate" style={{ color: 'var(--text)' }}>
                {tx.description}
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
                {formatDate(tx.created_at)}
              </div>
            </div>

            {/* Points */}
            <div
              className="text-sm font-medium flex-shrink-0"
              style={{ color: isPlus ? 'var(--sage)' : 'var(--clay-dark)' }}
            >
              {isPlus ? '+' : '−'}{Math.abs(tx.points).toLocaleString()} pts
            </div>
          </div>
        );
      })}
    </div>
  );
}
