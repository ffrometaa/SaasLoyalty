'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, User, Mail, Bell, Shield, LogOut } from 'lucide-react';
import { LanguageSwitcher } from '@/components/member/LanguageSwitcher';

// Mock member data
const mockMember = {
  name: 'Maria Garcia',
  email: 'maria@email.com',
  phone: '+1 234 567 8900',
  memberCode: 'SPA-00284',
  tier: 'silver',
  acceptsEmail: true,
  acceptsPush: false,
};

export default function ProfilePage() {
  const [member, setMember] = useState(mockMember);

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
              <h1 className="text-xl font-bold text-gray-900">Profile</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-indigo-600">
                {member.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{member.name}</h2>
              <p className="text-sm text-gray-500">@{member.memberCode}</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700 capitalize">
                {member.tier} Member
              </span>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Contact Information</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Member Code</p>
                <p className="font-medium text-gray-900 font-mono">{member.memberCode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive updates about points and rewards</p>
                </div>
              </div>
              <button
                onClick={() => setMember(m => ({ ...m, acceptsEmail: !m.acceptsEmail }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  member.acceptsEmail ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    member.acceptsEmail ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Bell className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Push Notifications</p>
                  <p className="text-sm text-gray-500">Get instant alerts</p>
                </div>
              </div>
              <button
                onClick={() => setMember(m => ({ ...m, acceptsPush: !m.acceptsPush }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  member.acceptsPush ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    member.acceptsPush ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Account */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Account</h3>
          </div>
          <div className="p-4 space-y-4">
            <LanguageSwitcher />
            <button className="w-full flex items-center gap-3 p-3 -mx-3 rounded-lg hover:bg-gray-50">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Shield className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">Privacy & Security</p>
                <p className="text-sm text-gray-500">Manage your account security</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-3 -mx-3 rounded-lg hover:bg-gray-50 text-red-600">
              <div className="p-2 bg-red-50 rounded-lg">
                <LogOut className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Sign Out</p>
              </div>
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="text-center text-sm text-gray-400">
          <p>LoyaltyOS v1.0.0</p>
          <p className="mt-1">Powered by LoyaltyOS</p>
        </div>
      </div>
    </div>
  );
}
