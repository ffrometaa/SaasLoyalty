'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { QrCode, ChevronLeft, CheckCircle, Clock, Gift, Loader2 } from 'lucide-react';

type Redemption = {
  id: string;
  reward_name: string;
  status: 'pending' | 'used' | 'expired';
  alphanumeric_code: string;
  expires_at: string;
  used_at: string | null;
};

export default function MyRedemptionsPage() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRedemption, setSelectedRedemption] = useState<Redemption | null>(null);
  
  useEffect(() => {
    fetch('/api/member/redemptions')
      .then(r => r.json())
      .then(data => {
        if (data.redemptions) setRedemptions(data.redemptions);
      })
      .finally(() => setLoading(false));
  }, []);

  const pendingRedemptions = redemptions.filter(r => r.status === 'pending');
  const usedRedemptions = redemptions.filter(r => r.status === 'used');

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
              <h1 className="text-xl font-bold text-gray-900">My Redemptions</h1>
              <p className="text-sm text-gray-500">Show these codes to the staff</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
        <>
        {/* Pending Redemptions */}
        {pendingRedemptions.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-gray-500 mb-3">
              Active ({pendingRedemptions.length})
            </h2>
            <div className="space-y-3">
              {pendingRedemptions.map((redemption) => (
                <button
                  key={redemption.id}
                  onClick={() => setSelectedRedemption(redemption)}
                  className="w-full bg-white rounded-xl p-4 shadow-sm border-2 border-indigo-500 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-indigo-100 rounded-xl">
                        <QrCode className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{redemption.reward_name}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Expires {new Date(redemption.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                      Active
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Used Redemptions */}
        {usedRedemptions.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-gray-500 mb-3">
              Used ({usedRedemptions.length})
            </h2>
            <div className="space-y-3">
              {usedRedemptions.map((redemption) => (
                <div
                  key={redemption.id}
                  className="bg-white rounded-xl p-4 shadow-sm opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gray-100 rounded-xl">
                        <Gift className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{redemption.reward_name}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Used on {new Date(redemption.used_at!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                      Used
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {redemptions.length === 0 && (
          <div className="text-center py-12">
            <QrCode className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No redemptions yet</h3>
            <p className="mt-2 text-gray-500">
              Start earning points and redeem them for rewards!
            </p>
            <Link
              href="/rewards"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
            >
              <Gift className="h-4 w-4" />
              Browse Rewards
            </Link>
          </div>
        )}
        </>
        )}
      </div>

      {/* QR Code Modal */}
      {selectedRedemption && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedRedemption(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
            <h2 className="text-xl font-bold text-gray-900">{selectedRedemption.reward_name}</h2>
            <p className="text-sm text-gray-500 mt-1">Show this to the staff</p>
            
            {/* QR Code */}
            <div className="mt-6 p-4 bg-gray-100 rounded-xl inline-block">
              <div className="w-48 h-48 bg-white border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <QrCode className="h-16 w-16 text-gray-400 mx-auto" />
                  <p className="text-xs text-gray-400 mt-2">QR Code</p>
                </div>
              </div>
            </div>
            
            {/* Alphanumeric Code */}
            <div className="mt-6 p-4 bg-indigo-50 rounded-xl">
              <p className="text-sm text-indigo-600">Or enter code:</p>
              <p className="text-3xl font-mono font-bold text-indigo-700 tracking-widest mt-1">
                {selectedRedemption.alphanumeric_code}
              </p>
            </div>
            
            {/* Expiration */}
            <p className="mt-4 text-sm text-gray-500">
              Valid until {new Date(selectedRedemption.expires_at).toLocaleDateString()}
            </p>
            
            <button
              onClick={() => setSelectedRedemption(null)}
              className="mt-6 w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
