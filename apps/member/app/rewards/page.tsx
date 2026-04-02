'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Gift, ChevronLeft, Check, Lock } from 'lucide-react';

// Mock data for demo
const mockRewards = [
  { id: '1', name: 'Free Massage (30 min)', description: 'Relaxing full body massage', pointsRequired: 5000, isAvailable: true },
  { id: '2', name: '10% Off Next Visit', description: 'Get 10% off your next service', pointsRequired: 1000, isAvailable: true },
  { id: '3', name: 'Free Product Sample', description: 'Complimentary skincare product', pointsRequired: 2500, isAvailable: true },
  { id: '4', name: 'VIP Treatment', description: 'Premium service experience', pointsRequired: 10000, isAvailable: true },
  { id: '5', name: 'Free Upgrade', description: 'Upgrade any service for free', pointsRequired: 15000, isAvailable: false, pointsNeeded: 5000 },
];

const MEMBER_POINTS = 3200; // Demo member has 3200 points

export default function RewardsPage() {
  const [selectedReward, setSelectedReward] = useState<typeof mockRewards[0] | null>(null);

  const availableRewards = mockRewards.filter(r => r.isAvailable && r.pointsRequired <= MEMBER_POINTS);
  const lockedRewards = mockRewards.filter(r => !r.isAvailable || r.pointsRequired > MEMBER_POINTS);

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
              <h1 className="text-xl font-bold text-gray-900">Rewards</h1>
              <p className="text-sm text-gray-500">Choose a reward to redeem</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Points summary */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
          <p className="text-sm font-medium opacity-90">Your Balance</p>
          <p className="text-4xl font-bold mt-1">{MEMBER_POINTS.toLocaleString()}</p>
          <p className="text-sm opacity-80 mt-2">points available</p>
        </div>

        {/* Available Rewards */}
        {availableRewards.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Gift className="h-5 w-5 text-indigo-600" />
              Available to Redeem
            </h2>
            <div className="space-y-3">
              {availableRewards.map((reward) => (
                <button
                  key={reward.id}
                  onClick={() => setSelectedReward(reward)}
                  className="w-full bg-white rounded-xl p-4 shadow-sm border-2 border-transparent hover:border-indigo-500 transition-all text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{reward.name}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{reward.description}</p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-lg font-bold text-indigo-600">{reward.pointsRequired.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">points</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                      Redeem Now
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Locked Rewards */}
        {lockedRewards.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Lock className="h-5 w-5 text-gray-400" />
              Keep Saving For
            </h2>
            <div className="space-y-3">
              {lockedRewards.map((reward) => {
                const pointsNeeded = reward.pointsRequired - MEMBER_POINTS;
                const progress = (MEMBER_POINTS / reward.pointsRequired) * 100;
                
                return (
                  <div
                    key={reward.id}
                    className="bg-white rounded-xl p-4 shadow-sm opacity-75"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{reward.name}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{reward.description}</p>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-lg font-bold text-gray-400">{reward.pointsRequired.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">points</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{MEMBER_POINTS.toLocaleString()} pts</span>
                        <span>{pointsNeeded > 0 ? `${pointsNeeded.toLocaleString()} more needed` : 'Almost there!'}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gray-400 rounded-full transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Redemption Confirmation Modal */}
      {selectedReward && (
        <RedemptionModal 
          reward={selectedReward} 
          memberPoints={MEMBER_POINTS}
          onClose={() => setSelectedReward(null)} 
        />
      )}
    </div>
  );
}

function RedemptionModal({ 
  reward, 
  memberPoints, 
  onClose 
}: { 
  reward: typeof mockRewards[0]; 
  memberPoints: number;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    qrCode?: string;
    alphanumericCode?: string;
    expiresAt?: string;
    error?: string;
  } | null>(null);

  const remainingPoints = memberPoints - reward.pointsRequired;

  const handleRedeem = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate mock codes
    const qrCode = `RDM-${Math.random().toString(36).substring(2, 14).toUpperCase()}`;
    const alphanumericCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    setResult({
      success: true,
      qrCode,
      alphanumericCode,
      expiresAt: expiresAt.toISOString(),
    });
    setLoading(false);
  };

  if (result?.success && result.qrCode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mt-4">Redemption Ready!</h2>
          <p className="text-gray-600 mt-2">Show this code to the staff</p>
          
          {/* QR Code placeholder */}
          <div className="mt-6 p-4 bg-white border-2 border-gray-200 rounded-xl mx-auto inline-block">
            <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
              <p className="text-xs text-gray-500">QR Code</p>
              {/* In production, use a QR code library */}
            </div>
          </div>
          
          {/* Alphanumeric code */}
          <div className="mt-4">
            <p className="text-sm text-gray-500">Or use code:</p>
            <p className="text-2xl font-mono font-bold text-indigo-600 tracking-wider">
              {result.alphanumericCode}
            </p>
          </div>
          
          {/* Expiration */}
          <p className="mt-4 text-sm text-gray-500">
            Valid until {new Date(result.expiresAt!).toLocaleDateString()}
          </p>
          
          {/* Remaining points */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Points remaining</span>
              <span className="font-bold text-gray-900">{remainingPoints.toLocaleString()}</span>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="mt-6 w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-900">Redeem Reward</h2>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-semibold text-gray-900">{reward.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{reward.description}</p>
        </div>
        
        <div className="mt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Your points</span>
            <span className="font-medium">{memberPoints.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Cost</span>
            <span className="font-medium text-red-600">-{reward.pointsRequired.toLocaleString()}</span>
          </div>
          <div className="border-t pt-3 flex justify-between">
            <span className="font-semibold text-gray-900">Remaining</span>
            <span className="font-bold text-indigo-600">{remainingPoints.toLocaleString()}</span>
          </div>
        </div>
        
        {result?.error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {result.error}
          </div>
        )}
        
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleRedeem}
            disabled={loading}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Redeem'}
          </button>
        </div>
      </div>
    </div>
  );
}
