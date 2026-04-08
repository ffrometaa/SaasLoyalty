'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Bell } from 'lucide-react';

type InAppNotification = {
  id: string;
  type: string;
  title: string | null;
  content: string | null;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

const TYPE_ICON: Record<string, string> = {
  earn: '⭐',
  redeem: '🎁',
  birthday: '🎂',
  referral: '🎉',
  expire: '⏰',
  adjustment: '✏️',
  tier_upgrade: '🏆',
};

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'Now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const router = useRouter();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async (cursor?: string) => {
    const url = cursor
      ? `/api/member/notifications?limit=20&cursor=${encodeURIComponent(cursor)}`
      : '/api/member/notifications?limit=20';

    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    return data;
  }, []);

  useEffect(() => {
    load().then((data) => {
      if (!data) return;
      setNotifications(data.notifications ?? []);
      setHasMore(data.hasMore ?? false);
      setNextCursor(data.nextCursor ?? null);
      setUnreadCount(data.unreadCount ?? 0);
      setLoading(false);
    });
  }, [load]);

  // Mark all as read when page opens
  useEffect(() => {
    fetch('/api/member/notifications/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      .then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
        setUnreadCount(0);
      })
      .catch(() => {});
  }, []);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const data = await load(nextCursor);
    if (data) {
      setNotifications((prev) => [...prev, ...(data.notifications ?? [])]);
      setHasMore(data.hasMore ?? false);
      setNextCursor(data.nextCursor ?? null);
    }
    setLoadingMore(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-safe">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 -ml-1 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {t('title')}
            {unreadCount > 0 && (
              <span className="ml-2 text-xs font-medium bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                {t('newBadge', { count: unreadCount })}
              </span>
            )}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">{t('loading')}</div>
        ) : notifications.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-center px-8">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Bell className="h-7 w-7 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm">{t('empty')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 bg-white">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex gap-3 px-4 py-4 transition-colors ${!n.read_at ? 'bg-blue-50' : ''}`}
              >
                <div className="shrink-0 w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                  {TYPE_ICON[n.type] ?? '🔔'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-snug">
                    {n.title ?? n.type}
                  </p>
                  {n.content && (
                    <p className="text-sm text-gray-500 mt-0.5 leading-snug">{n.content}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {!n.read_at && (
                  <div className="shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="py-4 text-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="text-sm text-brand-purple font-medium disabled:opacity-50"
            >
              {loadingMore ? t('loading') : t('loadMore')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
