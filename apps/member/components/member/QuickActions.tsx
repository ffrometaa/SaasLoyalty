'use client';

import Link from 'next/link';
import { useState } from 'react';

interface ToastState {
  visible: boolean;
  message: string;
}

export function QuickActions() {
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '' });

  function showToast(message: string) {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 2500);
  }

  return (
    <div className="relative">
      <div
        className="grid grid-cols-3 gap-2.5 px-5 pt-5"
      >
        {/* Canjear */}
        <Link
          href="/rewards"
          className="flex flex-col items-center gap-1.5 rounded-[14px] p-3.5 cursor-pointer transition-colors"
          style={{
            background: 'white',
            border: '1px solid var(--border)',
          }}
        >
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center"
            style={{ background: 'var(--sage-light)' }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--sage-dark)" strokeWidth="1.8">
              <path d="M12 8v13m0-13V6a4 4 0 014-4h1m-5 6H6a4 4 0 01-4-4V6a4 4 0 014-4h1m5 6v13M6 8h12" />
            </svg>
          </div>
          <span className="text-[11px] text-center" style={{ color: 'var(--text)' }}>Canjear</span>
        </Link>

        {/* Reservar */}
        <button
          onClick={() => showToast('Próximamente: Reservar cita')}
          className="flex flex-col items-center gap-1.5 rounded-[14px] p-3.5 cursor-pointer transition-colors w-full"
          style={{
            background: 'white',
            border: '1px solid var(--border)',
          }}
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
          <span className="text-[11px] text-center" style={{ color: 'var(--text)' }}>Reservar</span>
        </button>

        {/* Referir */}
        <button
          onClick={() => showToast('Compartiendo tu código de referido...')}
          className="flex flex-col items-center gap-1.5 rounded-[14px] p-3.5 cursor-pointer transition-colors w-full"
          style={{
            background: 'white',
            border: '1px solid var(--border)',
          }}
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
          <span className="text-[11px] text-center" style={{ color: 'var(--text)' }}>Referir amiga</span>
        </button>
      </div>

      {/* Toast */}
      {toast.visible && (
        <div
          className="absolute left-5 right-5 rounded-xl px-4 py-3 text-[13px] text-white text-center z-50 animate-slide-up"
          style={{ background: 'var(--text)', bottom: '-52px' }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
