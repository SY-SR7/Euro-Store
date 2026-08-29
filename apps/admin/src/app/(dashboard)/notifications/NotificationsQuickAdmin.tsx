'use client';

import { Bell, CheckCheck, RefreshCw, Search } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';

type Notification = {
  id: string;
  type: string;
  title_ar: string;
  title_en: string;
  body_ar: string;
  body_en: string;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  sent_push: boolean;
  sent_email: boolean;
  created_at: string;
  data: Record<string, unknown> | null;
};

const notificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  title_ar: z.string(),
  title_en: z.string(),
  body_ar: z.string(),
  body_en: z.string(),
  reference_id: z.string().nullable(),
  reference_type: z.string().nullable(),
  is_read: z.boolean(),
  sent_push: z.boolean(),
  sent_email: z.boolean(),
  created_at: z.string(),
  data: z.record(z.unknown()).nullable(),
});

const notificationsResponseSchema = z.object({ data: z.array(notificationSchema) });

function responseError(value: unknown, fallback: string): string {
  if (!value || typeof value !== 'object') return fallback;
  const error = (value as { error?: unknown }).error;
  return typeof error === 'string' ? error : fallback;
}

function notificationHref(item: Notification) {
  if (!item.reference_id) return null;
  if (item.reference_type === 'orders' || item.reference_type === 'order') return `/orders?open=${item.reference_id}`;
  if (item.reference_type === 'exchange_requests' || item.reference_type === 'exchange') return `/exchanges?open=${item.reference_id}`;
  if (item.reference_type === 'product_variant') return '/reports?type=inventory';
  return null;
}

export default function NotificationsQuickAdmin() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const response = await fetch(`/api/notifications?per_page=100${unreadOnly ? '&unread=1' : ''}`, { cache: 'no-store' });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) setError(responseError(payload, 'load_failed'));
    else {
      const parsed = notificationsResponseSchema.safeParse(payload);
      if (parsed.success) setItems(parsed.data.data);
      else setError('invalid_notification_response');
    }
    setLoading(false);
  }, [unreadOnly]);

  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return items;
    return items.filter((item) => `${item.title_ar} ${item.title_en} ${item.body_ar} ${item.body_en}`.toLowerCase().includes(text));
  }, [items, query]);

  async function markRead(id: string) {
    const response = await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    if (response.ok) setItems((current) => unreadOnly ? current.filter((item) => item.id !== id) : current.map((item) => item.id === id ? { ...item, is_read: true } : item));
  }

  async function markAllRead() {
    const response = await fetch('/api/notifications/read-all', { method: 'PUT' });
    if (response.ok) setItems((current) => unreadOnly ? [] : current.map((item) => ({ ...item, is_read: true })));
  }

  return (
    <div className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="flex flex-col gap-3 border-b pb-5 md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-2xl font-black">{isAr ? 'الإشعارات' : 'Notifications'}</h1><p className="mt-1 text-sm text-muted-foreground">{items.filter((item) => !item.is_read).length} {isAr ? 'غير مقروء' : 'unread'}</p></div>
        <div className="flex gap-2"><button onClick={() => void markAllRead()} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold"><CheckCheck size={16} />{isAr ? 'قراءة الكل' : 'Mark all read'}</button><button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold"><RefreshCw size={16} />{isAr ? 'تحديث' : 'Refresh'}</button></div>
      </header>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex gap-2"><button onClick={() => setUnreadOnly(false)} className={`rounded-md border px-3 py-2 text-sm ${!unreadOnly ? 'border-primary bg-primary/10' : ''}`}>{isAr ? 'الكل' : 'All'}</button><button onClick={() => setUnreadOnly(true)} className={`rounded-md border px-3 py-2 text-sm ${unreadOnly ? 'border-primary bg-primary/10' : ''}`}>{isAr ? 'غير المقروء' : 'Unread'}</button></div>
        <label className="relative max-w-md flex-1"><Search size={16} className="absolute start-3 top-3 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isAr ? 'بحث في الإشعارات' : 'Search notifications'} className="w-full rounded-md border py-2.5 pe-3 ps-9 text-sm" /></label>
      </div>
      {error && <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <section className="divide-y border">
        {loading ? <p className="p-8 text-center text-sm text-muted-foreground">{isAr ? 'جار التحميل...' : 'Loading...'}</p> : visible.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">{isAr ? 'لا توجد إشعارات' : 'No notifications'}</p> : visible.map((item) => {
          const href = notificationHref(item);
          const content = <><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${item.is_read ? 'bg-muted text-muted-foreground' : 'bg-primary/15 text-primary'}`}><Bell size={16} /></span><span className="min-w-0 flex-1"><span className="block font-bold">{isAr ? item.title_ar : item.title_en}</span><span className="mt-1 block text-sm text-muted-foreground">{isAr ? item.body_ar : item.body_en}</span><span className="mt-2 block text-xs text-muted-foreground">{new Intl.DateTimeFormat(isAr ? 'ar-SY' : 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.created_at))}</span></span>{!item.is_read && <span className="h-2 w-2 rounded-full bg-red-500" />}</>;
          return href ? <Link key={item.id} href={href} onClick={() => void markRead(item.id)} className="flex gap-3 p-4 hover:bg-muted/40">{content}</Link> : <button key={item.id} onClick={() => void markRead(item.id)} className="flex w-full gap-3 p-4 text-start hover:bg-muted/40">{content}</button>;
        })}
      </section>
    </div>
  );
}
