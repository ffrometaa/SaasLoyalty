'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';

interface AdminShellProps {
  admin: { id: string; full_name: string; email: string };
  header: ReactNode;
  children: ReactNode;
}

export function AdminShell({ admin, header, children }: AdminShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0f1c] flex">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar wrapper — hidden off-screen on mobile, always visible on lg+ */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <AdminSidebar admin={admin} onClose={() => setOpen(false)} />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0 bg-[#0a0a0f]">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-[#0f172a]/95 backdrop-blur border-b border-white/[0.06]">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Open navigation"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-white">LoyaltyOS</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/30">
            Admin
          </span>
        </div>

        {header}
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
