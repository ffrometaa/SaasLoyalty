'use client';

import Link from 'next/link';
import { Gift, History, User, QrCode, Star } from 'lucide-react';

// Mock data
const MEMBER = {
  name: 'Maria Garcia',
  points: 3200,
  tier: 'silver',
  tierEmoji: '🥈',
  progress: 32, // percentage to next tier
  pointsToNext: 1800,
};

export default function MemberHomePage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Points Balance Card */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 pb-20 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div className="text-white">
            <p className="text-sm font-medium opacity-90">Welcome back,</p>
            <h1 className="text-xl font-bold">{MEMBER.name}</h1>
          </div>
          <Link 
            href="/profile"
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <User className="h-6 w-6 text-white" />
          </Link>
        </div>
        
        <div className="text-white text-center py-8">
          <p className="text-sm font-medium opacity-80">Your Points Balance</p>
          <p className="text-6xl font-bold mt-2">{MEMBER.points.toLocaleString()}</p>
          
          {/* Tier Badge */}
          <div className="mt-4 inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
            <span className="text-xl">{MEMBER.tierEmoji}</span>
            <span className="font-semibold capitalize">{MEMBER.tier} Member</span>
          </div>
        </div>
      </div>

      {/* Progress Card (overlapping) */}
      <div className="mx-4 -mt-12 bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Progress to Gold</span>
          <span className="text-sm font-bold text-indigo-600">{MEMBER.pointsToNext.toLocaleString()} pts to go</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
            style={{ width: `${MEMBER.progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>{MEMBER.tier}</span>
          <span>Gold</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-6">
        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/rewards"
            className="flex flex-col items-center bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-3 bg-indigo-100 rounded-full">
              <Gift className="h-6 w-6 text-indigo-600" />
            </div>
            <span className="mt-2 text-sm font-medium text-gray-900">Rewards</span>
          </Link>
          <Link
            href="/history"
            className="flex flex-col items-center bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-3 bg-green-100 rounded-full">
              <History className="h-6 w-6 text-green-600" />
            </div>
            <span className="mt-2 text-sm font-medium text-gray-900">History</span>
          </Link>
          <Link
            href="/redemptions"
            className="flex flex-col items-center bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-3 bg-purple-100 rounded-full">
              <QrCode className="h-6 w-6 text-purple-600" />
            </div>
            <span className="mt-2 text-sm font-medium text-gray-900">My Codes</span>
          </Link>
        </div>
      </div>

      {/* Featured Reward */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Featured Reward</h2>
        <Link
          href="/rewards"
          className="block bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-5 text-white"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Star className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">VIP Treatment</h3>
              <p className="text-sm opacity-90">Premium service experience</p>
              <p className="text-sm font-semibold mt-1">10,000 points</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Pending Redemptions */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Redemptions</h2>
        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          <QrCode className="h-12 w-12 text-gray-300 mx-auto" />
          <p className="mt-3 font-medium text-gray-900">No active redemptions</p>
          <p className="text-sm text-gray-500 mt-1">
            Redeem your points for exciting rewards!
          </p>
          <Link
            href="/rewards"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
          >
            <Gift className="h-4 w-4" />
            Browse Rewards
          </Link>
        </div>
      </div>
    </div>
  );
}
