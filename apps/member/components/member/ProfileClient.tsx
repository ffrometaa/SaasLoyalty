'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Mail, User, LogOut, Shield, Gift, Pencil, Check, KeyRound, Trash2, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@loyalty-os/ui';
import { LanguageSwitcher } from '@/components/member/LanguageSwitcher';
import { getSupabaseClient } from '@loyalty-os/lib';

interface ProfileClientProps {
  name: string;
  email: string;
  memberCode: string;
  tier: string;
  pointsBalance: number;
  pointsLifetime: number;
}

export function ProfileClient({ name: initialName, email, memberCode, tier, pointsBalance, pointsLifetime }: ProfileClientProps): JSX.Element {
  const router = useRouter();
  const t = useTranslations('profile');

  const [name, setName] = useState(initialName);
  const [editName, setEditName] = useState(initialName);
  const [editingName, setEditingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwUpdated, setPwUpdated] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [fbType, setFbType] = useState<'bug' | 'suggestion' | 'general'>('general');
  const [fbMessage, setFbMessage] = useState('');
  const [fbSending, setFbSending] = useState(false);
  const [fbSent, setFbSent] = useState(false);
  const [fbError, setFbError] = useState('');

  async function handleSendFeedback(): Promise<void> {
    if (!fbMessage.trim()) return;
    setFbSending(true);
    setFbError('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: fbType, message: fbMessage }),
      });
      if (!res.ok) throw new Error();
      setFbSent(true);
      setFbMessage('');
    } catch {
      setFbError('Failed to send. Please try again.');
    } finally {
      setFbSending(false);
    }
  }

  async function handleLogout(): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) return;
    router.push('/login');
    router.refresh();
  }

  async function handleSaveName(): Promise<void> {
    if (!editName.trim() || editName === name) { setEditingName(false); return; }
    setNameSaving(true);
    setNameError('');
    try {
      const res = await fetch('/api/member/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (!res.ok) { setNameError('Failed to save name. Please try again.'); return; }
      setName(editName.trim());
      setEditingName(false);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    } catch {
      setNameError('Failed to save name. Please try again.');
    } finally {
      setNameSaving(false);
    }
  }

  async function handleUpdatePassword(): Promise<void> {
    if (newPassword.length < 8) { setPwError('Minimum 8 characters'); return; }
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match'); return; }
    setPwError('');
    setPwLoading(true);
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) { setPwError(error.message); return; }
    setNewPassword('');
    setConfirmPassword('');
    setPwUpdated(true);
    setTimeout(() => setPwUpdated(false), 3000);
  }

  async function handleDeleteAccount(): Promise<void> {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    try {
      const res = await fetch('/api/member/account', { method: 'DELETE' });
      if (!res.ok) return;
      const supabase = getSupabaseClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) return;
      router.push('/join');
    } catch {
      // Network error — deleting resets via finally; user can retry
    } finally {
      setDeleting(false);
    }
  }

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen pb-24 bg-[var(--cream,#faf8f4)]">
      {/* Header */}
      <div className="px-6 pt-10 pb-12 bg-[var(--brand-primary-dark,#2c3a28)]">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0 bg-white/[0.15]">
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">{name}</h1>
            <p className="text-sm text-white/60 mt-0.5">{t(`tierLabels.${tier}` satisfies Parameters<typeof t>[0])} · {memberCode}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="rounded-xl p-4 bg-white/[0.08]">
            <p className="text-2xl font-bold text-white">{pointsBalance.toLocaleString()}</p>
            <p className="text-xs text-white/60 mt-0.5">{t('pointsAvailable')}</p>
          </div>
          <div className="rounded-xl p-4 bg-white/[0.08]">
            <p className="text-2xl font-bold text-white">{pointsLifetime.toLocaleString()}</p>
            <p className="text-xs text-white/60 mt-0.5">{t('pointsLifetime')}</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Contact Info */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t('information')}</h3>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Mail className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">{t('email')}</p>
                <p className="text-sm font-medium text-gray-900">{email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="p-2 bg-gray-100 rounded-lg">
                <User className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">{t('memberCode')}</p>
                <p className="text-sm font-medium text-gray-900 font-mono">{memberCode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t('settings')}</h3>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="px-4 py-3.5">
              <LanguageSwitcher />
            </div>
            <Link href="/profile/referrals" className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Gift className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{t('referFriends')}</p>
                <p className="text-xs text-gray-400">{t('referFriendsDesc')}</p>
              </div>
            </Link>
            <Link href="/legal/privacy-policy" className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Shield className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{t('privacySecurity')}</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t('editProfile')}</h3>
            {nameSaved && <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><Check className="h-3 w-3" />{t('saved')}</span>}
          </div>
          <div className="px-4 py-3.5">
            <label className="block text-xs text-gray-400 mb-1">{t('editName')}</label>
            {editingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="flex-1 px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
                  autoFocus
                />
                <button onClick={handleSaveName} disabled={nameSaving}
                  className="px-3 py-2 bg-brand-purple text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                  {nameSaving ? '…' : t('saveChanges')}
                </button>
                <button onClick={() => { setEditingName(false); setEditName(name); setNameError(''); }}
                  className="px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg">✕</button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{name}</span>
                <button onClick={() => setEditingName(true)} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            )}
            {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
              <KeyRound className="h-4 w-4" />{t('changePassword')}
            </h3>
            {pwUpdated && <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><Check className="h-3 w-3" />{t('passwordUpdated')}</span>}
          </div>
          <div className="px-4 py-3.5 space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('newPassword')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('confirmPassword')}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
                placeholder="••••••••"
              />
              {pwError && <p className="text-xs text-red-500 mt-1">{pwError}</p>}
            </div>
            <button
              onClick={handleUpdatePassword}
              disabled={pwLoading || newPassword.length < 8 || newPassword !== confirmPassword}
              className="w-full py-2 bg-brand-purple text-white text-sm font-semibold rounded-lg disabled:opacity-40 transition-opacity"
            >
              {pwLoading ? '…' : t('updatePassword')}
            </button>
          </div>
        </div>

        {/* Delete Account */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-red-100">
          <div className="px-4 py-3 border-b border-red-100">
            <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wide flex items-center gap-2">
              <Trash2 className="h-4 w-4" />{t('deleteAccount')}
            </h3>
          </div>
          <div className="px-4 py-3.5 space-y-3">
            <p className="text-xs text-gray-500">{t('deleteAccountDesc')}</p>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('deleteAccountConfirm')}</label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 font-mono"
                placeholder="DELETE"
              />
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== 'DELETE' || deleting}
              className="w-full py-2 bg-red-600 text-white text-sm font-semibold rounded-lg disabled:opacity-40 transition-opacity"
            >
              {deleting ? '…' : t('deleteAccountButton')}
            </button>
          </div>
        </div>

        {/* Send Feedback */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-gray-400" />{t('sendFeedback')}
            </h3>
          </div>
          {fbSent ? (
            <div className="px-4 py-5 text-center">
              <p className="text-sm font-medium text-green-600">{t('feedbackSent')}</p>
              <button onClick={() => setFbSent(false)} className="mt-2 text-xs text-gray-400 underline">{t('feedbackSendAnother')}</button>
            </div>
          ) : (
            <div className="px-4 py-3.5 space-y-3">
              <div className="flex gap-2">
                {(['bug', 'suggestion', 'general'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setFbType(v)}
                    className={cn(
                      'flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors capitalize',
                      fbType === v
                        ? 'border-brand-purple bg-brand-purple-100 text-brand-purple'
                        : 'border-gray-200 text-gray-500'
                    )}
                  >
                    {v === 'bug' ? t('feedbackTypeBug') : v === 'suggestion' ? t('feedbackTypeIdea') : t('feedbackTypeGeneral')}
                  </button>
                ))}
              </div>
              <textarea
                value={fbMessage}
                onChange={e => setFbMessage(e.target.value)}
                rows={3}
                placeholder={t('feedbackPlaceholder')}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple resize-none"
              />
              {fbError && <p className="text-xs text-red-500">{fbError}</p>}
              <button
                onClick={handleSendFeedback}
                disabled={fbSending || !fbMessage.trim()}
                className="w-full py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-40 transition-opacity bg-brand-purple"
              >
                {fbSending ? t('feedbackSending') : t('sendFeedback')}
              </button>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-red-50 transition-colors"
          >
            <div className="p-2 bg-red-50 rounded-lg">
              <LogOut className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-sm font-medium text-red-600">{t('logout')}</p>
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">{t('poweredBy')}</p>
      </div>
    </div>
  );
}
