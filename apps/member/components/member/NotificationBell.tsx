'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';

const POLL_INTERVAL = 30_000; // 30 seconds

export function NotificationBell() {
  const [unread, setUnread] = useState(0);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch('/api/member/notifications?limit=1');
      if (!res.ok) return;
      const data = await res.json();
      setUnread(data.unreadCount ?? 0);
    } catch {
      // silently ignore — bell is non-critical
    }
  }, []);

  useEffect(() => {
    fetchUnread();

    const interval = setInterval(fetchUnread, POLL_INTERVAL);
    const onFocus = () => fetchUnread();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchUnread]);

  return (
    <Link
      href="/notifications"
      className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/20 transition-colors"
      aria-label="Notificaciones"
    >
      <Bell className="h-5 w-5" style={{ color: 'var(--text-on-brand, #fff)' }} />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  );
}
