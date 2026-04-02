'use client';

import { useState } from 'react';
import Link from 'next/link';
import { History, ChevronLeft, Gift, Plus, Minus, Gift as GiftIcon, Clock } from 'lucide-react';

// Mock data
const mockTransactions = [
  { id: '1', type: 'earn', points: 150, balance_after: 3200, description: 'Purchase at Serenity Spa', created_at: '2024-03-15T14:30:00' },
  { id: '2', type: 'redeem', points: -500, balance_after: 3050, description: 'Redeemed: 10% Off', created_at: '2024-03-10T10:15:00' },
  { id: '3', type: 'earn', points: 200, balance_after: 3550, description: 'Purchase at Serenity Spa', created_at: '2024-03-08T16:45:00' },
  { id: '4', type: 'bonus', points: 300, balance_after: 3350, description: 'Special bonus offer', created_at: '2024-03-01T09:00:00' },
  { id: '5', type: 'earn', points: 100, balance_after: 3050, description: 'Purchase at Serenity Spa', created_at: '2024-02-28T11:20:00' },
];

const transactionIcons = {
  earn: { icon: Plus, color: 'bg-green-100 text-green-600', label: 'Earned' },
  redeem: { icon: GiftIcon, color: 'bg-purple-100 text-purple-600', label: 'Redeemed' },
  bonus: { icon: Gift, color: 'bg-indigo-100 text-indigo-600', label: 'Bonus' },
  expire: { icon: Clock, color: 'bg-orange-100 text-orange-600', label: 'Expired' },
  refund: { icon: Minus, color: 'bg-red-100 text-red-600', label: 'Refund' },
};

export default function HistoryPage() {
  const [filter, setFilter] = useState<string | null>(null);
  
  const filteredTransactions = filter 
    ? mockTransactions.filter(t => t.type === filter)
    : mockTransactions;

  const groupedByMonth = filteredTransactions.reduce((acc, tx) => {
    const date = new Date(tx.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(tx);
    return acc;
  }, {} as Record<string, typeof mockTransactions>);

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100">
              <ChevronLeft className="h-6 w-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">History</h1>
              <p className="text-sm text-gray-500">Your points activity</p>
            </div>
          </div>
        </div>
        
        {/* Filter tabs */}
        <div className="px-4 pb-4 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilter(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === null 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {Object.entries(transactionIcons).map(([type, config]) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === type 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {config.label}s
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 space-y-6">
        {Object.entries(groupedByMonth).map(([monthKey, transactions]) => (
          <div key={monthKey}>
            <h2 className="text-sm font-medium text-gray-500 mb-3">
              {formatMonth(monthKey)}
            </h2>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {transactions.map((tx, index) => {
                const IconConfig = transactionIcons[tx.type as keyof typeof transactionIcons];
                const Icon = IconConfig.icon;
                
                return (
                  <div 
                    key={tx.id} 
                    className={`p-4 flex items-center gap-4 ${
                      index !== transactions.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-full ${IconConfig.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{tx.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(tx.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        tx.points > 0 ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        {tx.points > 0 ? '+' : ''}{tx.points.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {tx.balance_after.toLocaleString()} pts
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <History className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
}
