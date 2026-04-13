'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface ToastState {
  visible: boolean;
  message: string;
}

interface QuickActionsProps {
  memberCode?: string;
  shareUrl?: string;
  highlightRedeem?: boolean;
}

export function QuickActions({ memberCode, shareUrl, highlightRedeem }: QuickActionsProps) {
  const t = useTranslations('quickActions');
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '' });

  function showToast(message: string) {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 2500);
  }

  async function handleShareReferral() {
    const shareData = {
      title: 'Join my loyalty program!',
      text: `Use my code ${memberCode || 'REFCODE'} to join and earn points!`,
      url: shareUrl || window.location.origin,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
          showToast('Code copied to clipboard!');
        }
      }
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      showToast('Referral link copied!');
    } else {
      showToast('Sharing not available');
    }
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-3 gap-2.5 px-5 pt-5">
        {/* Redeem */}
        <Link
          href="/rewards"
          className="relative flex flex-col items-center gap-1.5 rounded-[14px] p-3.5 cursor-pointer transition-colors"
          style={{
            background: 'white',
            border: highlightRedeem ? '2px solid var(--brand-primary)' : '1px solid var(--border)',
          }}
        >
          {highlightRedeem && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: 'var(--brand-primary)' }}
              />
              <span
                className="relative inline-flex rounded-full h-3 w-3"
                style={{ background: 'var(--brand-primary)' }}
              />
            </span>
          )}
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center"
            style={{ background: 'var(--sage-light)' }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--sage-dark)" strokeWidth="1.8">
              <path d="M12 8v13m0-13V6a4 4 0 014-4h1m-5 6H6a4 4 0 01-4-4V6a4 4 0 014-4h1m5 6v13M6 8h12" />
            </svg>
          </div>
          <span className="text-xs text-center" style={{ color: 'var(--text)' }}>{t('redeem')}</span>
        </Link>

        {/* Book */}
        <button
          onClick={() => showToast(t('bookSoon'))}
          className="flex flex-col items-center gap-1.5 rounded-[14px] p-3.5 cursor-pointer transition-colors w-full"
          style={{ background: 'white', border: '1px solid var(--border)' }}
        >
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center"
            style={{ background: 'var(--clay-light)' }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--clay-dark)" strokeWidth="1.8">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <span className="text-xs text-center" style={{ color: 'var(--text)' }}>{t('book')}</span>
        </button>

        {/* Refer */}
        <button
          onClick={handleShareReferral}
          className="flex flex-col items-center gap-1.5 rounded-[14px] p-3.5 cursor-pointer transition-colors w-full"
          style={{ background: 'white', border: '1px solid var(--border)' }}
        >
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center"
            style={{ background: 'var(--gold-light)' }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--gold)" strokeWidth="1.8">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </div>
          <span className="text-xs text-center" style={{ color: 'var(--text)' }}>{t('refer')}</span>
        </button>
      </div>

      {/* Toast */}
      {toast.visible && (
        <div
          className="fixed left-5 right-5 max-w-md mx-auto rounded-xl px-4 py-3 text-[13px] text-white text-center z-[60] animate-slide-up"
          style={{ background: 'var(--text)', bottom: '80px' }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
