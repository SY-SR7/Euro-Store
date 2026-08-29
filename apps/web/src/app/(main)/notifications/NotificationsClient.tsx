'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, CheckCheck, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

type Notification = {
  id: string;
  title_ar: string;
  title_en: string;
  body_ar: string;
  body_en: string;
  is_read: boolean;
  created_at: string;
};

export function NotificationsClient({ isAr }: { isAr: boolean }) {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch('/api/notifications', { cache: 'no-store' });
      if (!response.ok) throw new Error('notifications_load_failed');
      const payload = await response.json() as { data?: Notification[] };
      setItems(Array.isArray(payload.data) ? payload.data : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(id: string) {
    const previous = items;
    setUpdating(id);
    setItems((current) => current.map((item) => item.id === id ? { ...item, is_read: true } : item));
    try {
      const response = await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'PUT' });
      if (!response.ok) throw new Error('notification_update_failed');
    } catch {
      setItems(previous);
      setError(true);
    } finally {
      setUpdating(null);
    }
  }

  async function markAllRead() {
    const previous = items;
    setUpdating('all');
    setItems((current) => current.map((item) => ({ ...item, is_read: true })));
    try {
      const response = await fetch('/api/notifications/read-all', { method: 'PUT' });
      if (!response.ok) throw new Error('notifications_update_failed');
    } catch {
      setItems(previous);
      setError(true);
    } finally {
      setUpdating(null);
    }
  }

  const hasUnread = items.some((item) => !item.is_read);

  return (
    <section className="min-h-screen bg-background px-4 py-10" dir={isAr ? 'rtl' : 'ltr'} aria-labelledby="notifications-title">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/account" aria-label={isAr ? 'العودة إلى الحساب' : 'Back to account'} className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:border-primary hover:text-primary">
              {isAr ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Link>
            <div>
              <h1 id="notifications-title" className="text-2xl font-black text-text-primary">{isAr ? 'الإشعارات' : 'Notifications'}</h1>
              <p className="text-sm text-text-muted">{isAr ? 'آخر تحديثات طلباتك وحسابك' : 'Updates about your orders and account'}</p>
            </div>
          </div>
          {hasUnread && (
            <button type="button" onClick={() => void markAllRead()} disabled={updating !== null} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-bold text-text-secondary transition-colors hover:border-primary hover:text-primary disabled:opacity-50">
              <CheckCheck className="h-4 w-4" />
              {isAr ? 'قراءة الكل' : 'Mark all read'}
            </button>
          )}
        </div>

        {error && (
          <div role="alert" className="mb-4 flex items-center justify-between gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span>{isAr ? 'تعذر تحديث الإشعارات. حاول مرة أخرى.' : 'Notifications could not be updated. Try again.'}</span>
            <button type="button" onClick={() => void load()} aria-label={isAr ? 'إعادة المحاولة' : 'Retry'} className="p-2 text-red-700 hover:bg-red-100">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-text-muted" role="status">{isAr ? 'جارٍ تحميل الإشعارات...' : 'Loading notifications...'}</div>
        ) : items.length === 0 ? (
          <div className="border-y border-border py-20 text-center">
            <Bell className="mx-auto mb-4 h-9 w-9 text-text-muted" />
            <p className="font-bold text-text-primary">{isAr ? 'لا توجد إشعارات بعد' : 'No notifications yet'}</p>
          </div>
        ) : (
          <div className="divide-y divide-border border-y border-border">
            {items.map((item) => (
              <article key={item.id} className={item.is_read ? 'py-5' : 'bg-primary/5 px-4 py-5'}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-bold text-text-primary">{isAr ? item.title_ar : item.title_en}</h2>
                    <p className="mt-1 leading-6 text-text-secondary">{isAr ? item.body_ar : item.body_en}</p>
                    <time className="mt-2 block text-xs text-text-muted" dateTime={item.created_at}>
                      {new Date(item.created_at).toLocaleString(isAr ? 'ar-SY' : 'en-US')}
                    </time>
                  </div>
                  {!item.is_read && (
                    <button type="button" onClick={() => void markRead(item.id)} disabled={updating !== null} aria-label={isAr ? 'تعليم كمقروء' : 'Mark as read'} title={isAr ? 'تعليم كمقروء' : 'Mark as read'} className="shrink-0 p-2 text-primary hover:bg-primary/10 disabled:opacity-50">
                      <Check className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
