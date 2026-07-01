'use client';

import Link from 'next/link';
import { AlertTriangle, Bell, CheckCircle2, ClipboardList, Percent, RefreshCw, Search, ShoppingBag, Undo2, Users, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';

type Tone = 'danger' | 'warning' | 'success' | 'info' | 'neutral';
type Source = 'orders' | 'exchanges' | 'customers' | 'discounts' | 'audit' | 'system';
type TabKey = 'all' | 'unread' | Source;

type NotificationItem = {
  id: string;
  source: Source;
  tone: Tone;
  priority: number;
  title: string;
  description: string;
  createdAt: string;
  actionHref?: string;
  actionLabel?: string;
  badge?: string;
  meta?: [string, string][];
};

const STORAGE_KEY = 'eurostore-admin-read-notifications-v2';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pickArray(payload: unknown, keys: string[]): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (isRecord(payload)) {
    for (const key of keys) {
      const value = payload[key];
      if (Array.isArray(value)) return value.filter(isRecord);
    }
  }
  return [];
}

function getString(row: Record<string, unknown>, key: string, fallback = '') {
  const value = row[key];
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

function getNumber(row: Record<string, unknown>, key: string, fallback = 0) {
  const value = Number(row[key]);
  return Number.isFinite(value) ? value : fallback;
}

function getBoolean(row: Record<string, unknown>, key: string, fallback = false) {
  const value = row[key];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  return fallback;
}

function nested(row: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = row[key];
  return isRecord(value) ? value : {};
}

function safeDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateText(value: string | undefined, locale: string) {
  const date = safeDate(value);
  if (!date) return '-';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function relative(value: string | undefined, t: any) {
  const date = safeDate(value);
  if (!date) return '-';
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = minute * 60;
  const day = hour * 24;
  const abs = Math.abs(diff);
  if (abs < minute) return t('timeNow');
  if (abs < hour) return t('timeMinsAgo', { count: Math.max(1, Math.round(abs / minute)) });
  if (abs < day) return t('timeHoursAgo', { count: Math.max(1, Math.round(abs / hour)) });
  return t('timeDaysAgo', { count: Math.max(1, Math.round(abs / day)) });
}

function money(value: number, locale: string, unit: string) {
  return `${Number(value || 0).toLocaleString(locale)} ${unit}`;
}

async function fetchJson(path: string): Promise<unknown> {
  try {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) return { __error: `${path}: ${response.status}` };
    return await response.json();
  } catch {
    return { __error: `${path}: failed` };
  }
}

function sourceIcon(source: Source) {
  const className = 'h-4 w-4';
  if (source === 'orders') return <ShoppingBag className={className} />;
  if (source === 'exchanges') return <Undo2 className={className} />;
  if (source === 'customers') return <Users className={className} />;
  if (source === 'discounts') return <Percent className={className} />;
  if (source === 'audit') return <ClipboardList className={className} />;
  return <Bell className={className} />;
}

function toneClass(tone: Tone) {
  if (tone === 'danger') return 'border-red-200 bg-red-50 text-red-700';
  if (tone === 'warning') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (tone === 'success') return 'border-green-200 bg-green-50 text-green-700';
  if (tone === 'info') return 'border-blue-200 bg-blue-50 text-blue-700';
  return 'border-[#E5E0D8] bg-[#F8F6F2] text-[#57534E]';
}

function buildOrderNotifications(rows: Record<string, unknown>[], t: any, locale: string, orderStatusMap: Record<string, string>, unitSyp: string): NotificationItem[] {
  return rows.slice(0, 60).map((row) => {
    const id = getString(row, 'id', crypto.randomUUID());
    const orderNumber = getString(row, 'order_number', id.slice(0, 8));
    const status = getString(row, 'status', 'pending');
    const total = getNumber(row, 'total_syp', 0);
    const createdAt = getString(row, 'created_at', new Date().toISOString());
    const address = nested(row, 'address_snapshot');
    const customer = getString(address, 'full_name', t('unspecifiedCustomer'));
    const phone = getString(address, 'phone', '');

    let tone: Tone = 'neutral';
    let priority = 30;
    let title = t('orderTitle', { status: orderStatusMap[status] ?? status });
    if (status === 'pending') {
      tone = 'warning';
      priority = 95;
      title = t('newOrder');
    } else if (status === 'cancelled') {
      tone = 'danger';
      priority = 75;
      title = t('cancelledOrder');
    } else if (status === 'confirmed' || status === 'processing') {
      tone = 'info';
      priority = 70;
    }

    return {
      id: `order:${id}:${status}`,
      source: 'orders',
      tone,
      priority,
      title,
      description: `#${orderNumber} - ${customer} - ${money(total, locale, unitSyp)}`,
      createdAt,
      actionHref: `/orders?open=${id}`,
      actionLabel: t('openOrder'),
      badge: orderStatusMap[status] ?? status,
      meta: [
        [t('metaOrderNumber'), orderNumber],
        [t('metaCustomer'), customer],
        [t('metaPhone'), phone || '-'],
        [t('metaTotal'), money(total, locale, unitSyp)],
        [t('metaStatus'), orderStatusMap[status] ?? status],
      ],
    };
  });
}

function buildExchangeNotifications(rows: Record<string, unknown>[], t: any, exchangeStatusMap: Record<string, string>): NotificationItem[] {
  return rows.slice(0, 60).map((row) => {
    const id = getString(row, 'id', crypto.randomUUID());
    const status = getString(row, 'status', 'pending');
    const createdAt = getString(row, 'created_at', new Date().toISOString());
    const reason = getString(row, 'reason_ar', getString(row, 'reason', t('noReason')));
    const orderId = getString(row, 'order_id', '');

    let tone: Tone = 'neutral';
    let priority = 35;
    if (status === 'pending' || status === 'requested') {
      tone = 'warning';
      priority = 92;
    } else if (status === 'rejected' || status === 'cancelled') {
      tone = 'danger';
      priority = 55;
    } else if (status === 'approved') {
      tone = 'info';
      priority = 68;
    } else if (status === 'completed') {
      tone = 'success';
      priority = 35;
    }

    return {
      id: `exchange:${id}:${status}`,
      source: 'exchanges',
      tone,
      priority,
      title: t('exchangeRequest'),
      description: `${exchangeStatusMap[status] ?? status} - ${reason}`,
      createdAt,
      actionHref: `/exchanges?open=${id}`,
      actionLabel: t('openExchange'),
      badge: exchangeStatusMap[status] ?? status,
      meta: [
        [t('metaId'), id],
        [t('metaLinkedOrder'), orderId || '-'],
        [t('metaStatus'), exchangeStatusMap[status] ?? status],
        [t('metaReason'), reason],
      ],
    };
  });
}

function buildDiscountNotifications(rows: Record<string, unknown>[], t: any, locale: string): NotificationItem[] {
  const items: NotificationItem[] = [];
  for (const row of rows.slice(0, 60)) {
    const id = getString(row, 'id', getString(row, 'code', crypto.randomUUID()));
    const code = getString(row, 'code', 'CODE');
    const active = getBoolean(row, 'is_active', true);
    const validUntil = getString(row, 'valid_until', '');
    const usedCount = getNumber(row, 'used_count', 0);
    const maxUses = getNumber(row, 'max_uses', 0);
    const expires = safeDate(validUntil);
    const expired = expires ? expires.getTime() < Date.now() : false;
    const usedUp = maxUses > 0 && usedCount >= maxUses;
    if (active && !expired && !usedUp) continue;
    items.push({
      id: `discount:${id}:${active}:${validUntil}:${usedCount}`,
      source: 'discounts',
      tone: expired || usedUp ? 'danger' : 'neutral',
      priority: expired || usedUp ? 72 : 28,
      title: expired ? t('codeExpired') : usedUp ? t('codeExhausted') : t('codeDisabled'),
      description: code,
      createdAt: validUntil || new Date().toISOString(),
      actionHref: `/discounts?open=${id}`,
      actionLabel: t('openDiscounts'),
      badge: expired ? t('badgeExpired') : usedUp ? t('badgeExhausted') : t('badgeDisabled'),
      meta: [
        [t('metaCode'), code],
        [t('metaUsage'), maxUses ? `${usedCount}/${maxUses}` : String(usedCount)],
        [t('metaExpires'), validUntil ? dateText(validUntil, locale) : '-'],
      ],
    });
  }
  return items;
}

function buildCustomerNotifications(rows: Record<string, unknown>[], t: any): NotificationItem[] {
  const twoDays = 2 * 24 * 60 * 60 * 1000;
  return rows.slice(0, 60).filter((row) => {
    const date = safeDate(getString(row, 'created_at', ''));
    return date ? Date.now() - date.getTime() <= twoDays : false;
  }).map((row) => {
    const id = getString(row, 'id', crypto.randomUUID());
    const name = getString(row, 'full_name', t('newCustomer'));
    const email = getString(row, 'email', '');
    const phone = getString(row, 'phone', '');
    const createdAt = getString(row, 'created_at', new Date().toISOString());
    return {
      id: `customer:${id}`,
      source: 'customers',
      tone: 'success',
      priority: 42,
      title: t('newCustomer'),
      description: name,
      createdAt,
      actionHref: `/customers?open=${id}`,
      actionLabel: t('openCustomer'),
      badge: t('badgeNew'),
      meta: [
        [t('metaName'), name],
        [t('metaEmail'), email || '-'],
        [t('metaPhone'), phone || '-'],
      ],
    } satisfies NotificationItem;
  });
}

function buildAuditNotifications(rows: Record<string, unknown>[], t: any, locale: string): NotificationItem[] {
  const ENTITY_MAP: Record<string, string> = {
    'catalog/products': 'المنتجات',
    'catalog/variants': 'متغيرات المنتجات',
    'catalog/categories': 'التصنيفات',
    'catalog/brands': 'العلامات التجارية',
    'orders': 'الطلبات',
    'customers': 'العملاء',
    'discounts': 'الخصومات',
    'exchanges': 'الاستبدال والترجيع',
    'settings': 'الإعدادات',
    'loyalty_settings': 'إعدادات الولاء'
  };

  return rows.slice(0, 40).map((row) => {
    const id = getString(row, 'id', crypto.randomUUID());
    const action = getString(row, 'action_ar', getString(row, 'action', t('systemAction')));
    const rawEntityType = getString(row, 'entity_type', t('systemEntity'));
    const entity = getString(row, 'entity_label', ENTITY_MAP[rawEntityType] || rawEntityType);
    const createdAt = getString(row, 'created_at', new Date().toISOString());
    const actionRaw = getString(row, 'action', '');
    const danger = actionRaw.includes('delete');
    return {
      id: `audit:${id}`,
      source: 'audit',
      tone: danger ? 'danger' : 'neutral',
      priority: danger ? 60 : 20,
      title: action,
      description: entity,
      createdAt,
      actionHref: `/audit-logs?open=${id}`,
      actionLabel: t('openAudit'),
      badge: entity,
      meta: [
        [t('metaAction'), action],
        [t('metaSection'), entity],
        [t('metaTime'), dateText(createdAt, locale)],
      ],
    };
  });
}

function systemErrors(payloads: unknown[]) {
  return payloads.flatMap((payload) => isRecord(payload) && typeof payload.__error === 'string' ? [payload.__error] : []);
}

function Modal({ title, onClose, children, closeTitle }: { title: string; onClose: () => void; children: ReactNode; closeTitle?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3" onClick={onClose}>
      <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-[#E5E0D8] bg-[#FFFCF7] shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] bg-white px-5 py-4">
          <h2 className="font-black text-[#1C1917]">{title}</h2>
          <button type="button" title={closeTitle || "Close"} onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg bg-[#F8F6F2] text-[#57534E] hover:bg-[#E5E0D8]">
            <X size={17} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export default function NotificationsQuickAdmin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const isAr = locale === 'ar';
  const t = useTranslations('adminNotifications');
  const tCommon = useTranslations('common');
  
  const formatLoc = isAr ? 'ar-SY' : 'en-US';

  const sourceMap: Record<Source, string> = useMemo(() => ({
    orders: t('sourceOrders'),
    exchanges: t('sourceExchanges'),
    customers: t('sourceCustomers'),
    discounts: t('sourceDiscounts'),
    audit: t('sourceAudit'),
    system: t('sourceSystem'),
  }), [t]);

  const orderStatusMap: Record<string, string> = useMemo(() => ({
    pending: t('orderStatusPending'),
    confirmed: t('orderStatusConfirmed'),
    processing: t('orderStatusProcessing'),
    shipped: t('orderStatusShipped'),
    delivered: t('orderStatusDelivered'),
    cancelled: t('orderStatusCancelled'),
  }), [t]);

  const exchangeStatusMap: Record<string, string> = useMemo(() => ({
    pending: t('exchangeStatusPending'),
    requested: t('exchangeStatusRequested'),
    approved: t('exchangeStatusApproved'),
    rejected: t('exchangeStatusRejected'),
    completed: t('exchangeStatusCompleted'),
    cancelled: t('exchangeStatusCancelled'),
  }), [t]);

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [tab, setTab] = useState<TabKey>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<NotificationItem | null>(null);
  const [autoOpenedId, setAutoOpenedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      setReadIds(Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []);
    } catch {
      setReadIds([]);
    }
  }, []);

  const saveRead = useCallback((next: string[]) => {
    setReadIds(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, 700)));
    } catch {
      // storage can be unavailable
    }
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setMsg('');
    Promise.all([
      fetchJson('/api/orders?limit=50'),
      fetchJson('/api/exchanges'),
      fetchJson('/api/customers?limit=50'),
      fetchJson('/api/discounts'),
      fetchJson('/api/audit-logs?limit=50'),
    ])
      .then(([ordersPayload, exchangesPayload, customersPayload, discountsPayload, auditPayload]) => {
        const errors = systemErrors([ordersPayload, exchangesPayload, customersPayload, discountsPayload, auditPayload]);
        const next = [
          ...buildOrderNotifications(pickArray(ordersPayload, ['orders', 'data', 'items']), t, formatLoc, orderStatusMap, tCommon('unitSyp', { fallback: 'ل.س' })),
          ...buildExchangeNotifications(pickArray(exchangesPayload, ['exchanges', 'data', 'items']), t, exchangeStatusMap),
          ...buildCustomerNotifications(pickArray(customersPayload, ['customers', 'data', 'items']), t),
          ...buildDiscountNotifications(pickArray(discountsPayload, ['discounts', 'data', 'items']), t, formatLoc),
          ...buildAuditNotifications(pickArray(auditPayload, ['logs', 'data', 'items']), t, formatLoc),
          ...errors.map((error, index) => ({
            id: `system:${index}:${error}`,
            source: 'system' as const,
            tone: 'warning' as const,
            priority: 85,
            title: t('systemDataSourceUnavailable'),
            description: error,
            createdAt: new Date().toISOString(),
            actionHref: '/settings',
            actionLabel: t('settingsLabel'),
            badge: t('connectionBadge'),
          })),
        ].sort((a, b) => b.priority - a.priority || ((safeDate(b.createdAt)?.getTime() ?? 0) - (safeDate(a.createdAt)?.getTime() ?? 0)));
        setItems(next);
      })
      .catch((error) => setMsg(error instanceof Error ? error.message : t('failedToLoadNotifications')))
      .finally(() => setLoading(false));
  }, [t, formatLoc, orderStatusMap, tCommon, exchangeStatusMap]);

  useEffect(() => {
    load();
  }, [load]);

  const unread = useMemo(() => new Set(items.filter((item) => !readIds.includes(item.id)).map((item) => item.id)), [items, readIds]);

  const tabs = useMemo<{ key: TabKey; label: string; count: number }[]>(() => [
    { key: 'all', label: t('allTab'), count: items.length },
    { key: 'unread', label: t('unreadTab'), count: unread.size },
    { key: 'orders', label: t('ordersTab'), count: items.filter((item) => item.source === 'orders').length },
    { key: 'exchanges', label: t('sourceExchanges'), count: items.filter((item) => item.source === 'exchanges').length },
    { key: 'customers', label: t('sourceCustomers'), count: items.filter((item) => item.source === 'customers').length },
    { key: 'discounts', label: t('sourceDiscounts'), count: items.filter((item) => item.source === 'discounts').length },
    { key: 'audit', label: t('sourceAudit'), count: items.filter((item) => item.source === 'audit').length },
    { key: 'system', label: t('sourceSystem'), count: items.filter((item) => item.source === 'system').length },
  ], [items, unread.size, t]);

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    return items.filter((item) => {
      if (tab === 'unread' && !unread.has(item.id)) return false;
      if (tab !== 'all' && tab !== 'unread' && item.source !== tab) return false;
      if (!text) return true;
      return `${item.title} ${item.description} ${item.badge ?? ''} ${sourceMap[item.source]}`.toLowerCase().includes(text);
    });
  }, [items, query, tab, unread, sourceMap]);

  const openItem = useCallback((item: NotificationItem, updateUrl = true) => {
    if (!readIds.includes(item.id)) saveRead([item.id, ...readIds]);
    setSelected(item);
    if (updateUrl) router.replace(`/notifications?open=${encodeURIComponent(item.id)}`, { scroll: false });
  }, [readIds, router, saveRead]);

  const closeItem = () => {
    setSelected(null);
    router.replace('/notifications', { scroll: false });
  };

  useEffect(() => {
    const itemId = searchParams.get('open');
    if (!itemId || autoOpenedId === itemId || selected?.id === itemId) return;

    const existing = items.find((item) => item.id === itemId);
    if (existing) {
      openItem(existing, false);
      setAutoOpenedId(itemId);
    }
  }, [autoOpenedId, items, openItem, searchParams, selected?.id]);

  const markAllRead = () => saveRead(items.map((item) => item.id));
  const resetRead = () => saveRead([]);

  return (
    <div className="space-y-5" dir={isAr ? "rtl" : "ltr"}>
      <section className="flex flex-col gap-4 rounded-lg border border-[#E5E0D8] bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1C1917]">{t('title')}</h1>
          <p className="mt-1 text-sm text-[#8B8172]">{t('unreadCount', { count: unread.size })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={markAllRead} className="inline-flex items-center gap-2 rounded-lg border border-[#E5E0D8] px-4 py-2 text-sm font-bold text-[#57534E] hover:border-[#B8860B]">
            <CheckCircle2 size={16} /> {t('markAllRead')}
          </button>
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg bg-[#1C1917] px-4 py-2 text-sm font-black text-white hover:bg-[#B8860B]">
            <RefreshCw size={16} /> {tCommon('refresh')}
          </button>
        </div>
      </section>

      {msg ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{msg}</div> : null}

      <section className="grid gap-3 md:grid-cols-4">
        {[
          [t('allTab'), items.length, Bell],
          [t('unreadTab'), unread.size, AlertTriangle],
          [t('urgentTab'), items.filter((item) => item.tone === 'danger' || item.priority >= 85).length, AlertTriangle],
          [t('ordersTab'), items.filter((item) => item.source === 'orders').length, ShoppingBag],
        ].map(([label, value, Icon]) => {
          const IconComponent = Icon as typeof Bell;
          return (
            <div key={String(label)} className="rounded-lg border border-[#E5E0D8] bg-white p-4 shadow-sm">
              <IconComponent size={16} className="text-[#B8860B]" />
              <p className="mt-3 text-2xl font-black text-[#1C1917]" dir="ltr">{Number(value).toLocaleString(formatLoc)}</p>
              <p className="mt-1 text-xs font-black text-[#8B8172]">{String(label)}</p>
            </div>
          );
        })}
      </section>

      <section className="rounded-lg border border-[#E5E0D8] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((item) => (
              <button key={item.key} type="button" onClick={() => setTab(item.key)} className={`whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-black ${tab === item.key ? 'border-[#B8860B] bg-[#B8860B] text-white' : 'border-[#E5E0D8] bg-[#FAF7EF] text-[#57534E] hover:border-[#B8860B]'}`}>
                {item.label} <span className="ms-1" dir="ltr">{item.count.toLocaleString(formatLoc)}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="flex overflow-hidden rounded-lg border border-[#E5E0D8] bg-[#FAFAF8] focus-within:border-[#B8860B]">
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchPlaceholder')} className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none" dir={isAr ? "rtl" : "ltr"} />
              <span className={`grid w-10 place-items-center ${isAr ? "border-r" : "border-l"} border-[#E5E0D8] text-[#8B8172]`}><Search size={16} /></span>
            </div>
            <button type="button" onClick={resetRead} className="rounded-lg border border-[#E5E0D8] px-3 py-2 text-xs font-bold text-[#57534E] hover:border-[#B8860B]">{t('showBtn')}</button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? <p className="p-10 text-center text-sm text-[#A8A29E]">{tCommon('loading')}</p>
        : visible.length === 0 ? <p className="p-10 text-center text-sm text-[#A8A29E]">{t('noNotifications')}</p>
        : (
          <div className="divide-y divide-[#F0ECE6]">
            {visible.map((item) => {
              const read = readIds.includes(item.id);
              return (
                <div key={item.id} className={`grid gap-3 p-4 transition hover:bg-[#FFFBF0] lg:grid-cols-[44px_minmax(0,1fr)_auto] lg:items-center ${read ? 'opacity-70' : ''}`}>
                  <button type="button" onClick={() => openItem(item)} className={`grid h-10 w-10 place-items-center rounded-lg border ${toneClass(item.tone)}`}>
                    {sourceIcon(item.source)}
                  </button>
                  <button type="button" onClick={() => openItem(item)} className={`min-w-0 ${isAr ? "text-right" : "text-left"}`}>
                    <span className="flex flex-wrap items-center gap-2">
                      {!read ? <span className="h-2 w-2 rounded-full bg-[#B8860B]" /> : null}
                      <span className="font-black text-[#1C1917]">{item.title}</span>
                      <span className={`rounded-full border px-2 py-1 text-[11px] font-bold ${toneClass(item.tone)}`}>{item.badge ?? sourceMap[item.source]}</span>
                    </span>
                    <span className="mt-1 block truncate text-sm text-[#57534E]">{item.description}</span>
                    <span className="mt-1 block text-xs text-[#A8A29E]">{dateText(item.createdAt, formatLoc)} - {relative(item.createdAt, t)}</span>
                  </button>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => saveRead(read ? readIds.filter((id) => id !== item.id) : [item.id, ...readIds])} className="rounded-lg border border-[#E5E0D8] px-3 py-2 text-xs font-bold text-[#57534E] hover:border-[#B8860B]">
                      {read ? t('btnUnread') : t('btnRead')}
                    </button>
                    {item.actionHref ? (
                      <Link href={item.actionHref} onClick={() => !read && saveRead([item.id, ...readIds])} className="rounded-lg bg-[#1C1917] px-3 py-2 text-xs font-black text-white hover:bg-[#B8860B]">
                        {item.actionLabel ?? t('openBtn')}
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selected ? (
        <Modal title={selected.title} onClose={closeItem} closeTitle={tCommon('close')}>
          <div className="space-y-4">
            <div className="rounded-lg border border-[#E5E0D8] bg-white p-4">
              <div className="flex items-center gap-2">
                <span className={`grid h-9 w-9 place-items-center rounded-lg border ${toneClass(selected.tone)}`}>{sourceIcon(selected.source)}</span>
                <div>
                  <p className="text-sm font-black text-[#1C1917]">{selected.description}</p>
                  <p className="mt-1 text-xs text-[#8B8172]">{sourceMap[selected.source]} - {dateText(selected.createdAt, formatLoc)}</p>
                </div>
              </div>
            </div>

            {selected.meta?.length ? (
              <div className="overflow-hidden rounded-lg border border-[#E5E0D8] bg-white">
                {selected.meta.map(([label, value]) => (
                  <div key={`${label}:${value}`} className="flex items-start justify-between gap-4 border-b border-[#F0ECE6] px-4 py-3 text-sm last:border-b-0">
                    <span className="text-[#8B8172]">{label}</span>
                    <span className={`max-w-[65%] break-words ${isAr ? "text-left" : "text-right"} font-black text-[#1C1917]`} dir="auto">{value}</span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              {selected.actionHref ? (
                <Link href={selected.actionHref} onClick={() => setSelected(null)} className="flex-1 rounded-lg bg-[#B8860B] px-4 py-3 text-center text-sm font-black text-white hover:bg-[#9A7209]">
                  {selected.actionLabel ?? t('openBtn')}
                </Link>
              ) : null}
              <button type="button" onClick={closeItem} className="rounded-lg border border-[#E5E0D8] px-4 py-3 text-sm font-bold text-[#57534E] hover:border-[#B8860B]">
                {tCommon('close')}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
