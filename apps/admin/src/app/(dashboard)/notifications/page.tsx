'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Tone = 'danger' | 'warning' | 'success' | 'info' | 'neutral';
type Source = 'orders' | 'exchanges' | 'customers' | 'discounts' | 'audit' | 'system';
type TabKey = 'all' | 'unread' | Source;

interface NotificationItem {
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
}

interface ToneStyle {
  card: string;
  icon: string;
  badge: string;
  dot: string;
  label: string;
}

const STORAGE_KEY = 'eurostore-admin-read-notifications-v1';

const SOURCE_AR: Record<Source, string> = {
  orders: 'الطلبات',
  exchanges: 'التبديلات',
  customers: 'العملاء',
  discounts: 'الخصومات',
  audit: 'السجل',
  system: 'النظام',
};

const SOURCE_ICON: Record<Source, string> = {
  orders: '🛒',
  exchanges: '🔁',
  customers: '👤',
  discounts: '🏷️',
  audit: '🧾',
  system: '⚙️',
};

const TONE_STYLE: Record<Tone, ToneStyle> = {
  danger: {
    card: 'border-red-200 bg-red-50/80',
    icon: 'bg-red-100 text-red-700 ring-red-200',
    badge: 'border-red-200 bg-red-100 text-red-700',
    dot: 'bg-red-500',
    label: 'عاجل',
  },
  warning: {
    card: 'border-amber-200 bg-amber-50/80',
    icon: 'bg-amber-100 text-amber-700 ring-amber-200',
    badge: 'border-amber-200 bg-amber-100 text-amber-800',
    dot: 'bg-amber-500',
    label: 'مهم',
  },
  success: {
    card: 'border-emerald-200 bg-emerald-50/80',
    icon: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    badge: 'border-emerald-200 bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
    label: 'جيد',
  },
  info: {
    card: 'border-blue-200 bg-blue-50/80',
    icon: 'bg-blue-100 text-blue-700 ring-blue-200',
    badge: 'border-blue-200 bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
    label: 'معلومة',
  },
  neutral: {
    card: 'border-[#E5E0D8] bg-white',
    icon: 'bg-[#F8F6F2] text-[#57534E] ring-[#E5E0D8]',
    badge: 'border-[#E5E0D8] bg-[#F8F6F2] text-[#57534E]',
    dot: 'bg-[#B8860B]',
    label: 'تنبيه',
  },
};

const ORDER_STATUS_AR: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  processing: 'جارٍ التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغى',
};

const EXCHANGE_STATUS_AR: Record<string, string> = {
  pending: 'قيد المراجعة',
  requested: 'قيد المراجعة',
  approved: 'مقبول',
  rejected: 'مرفوض',
  completed: 'مكتمل',
  cancelled: 'ملغى',
};

const ACTION_AR: Record<string, string> = {
  create: 'إنشاء',
  created: 'إنشاء',
  update: 'تحديث',
  updated: 'تحديث',
  delete: 'حذف',
  deleted: 'حذف',
  login: 'تسجيل دخول',
  logout: 'تسجيل خروج',
};

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

function getString(row: Record<string, unknown>, key: string, fallback = ''): string {
  const value = row[key];
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

function getNumber(row: Record<string, unknown>, key: string, fallback = 0): number {
  const value = row[key];
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function getBoolean(row: Record<string, unknown>, key: string, fallback = false): boolean {
  const value = row[key];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  return fallback;
}

function getNestedRecord(row: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = row[key];
  return isRecord(value) ? value : {};
}

function safeDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDateTime(value: string | undefined): string {
  const date = safeDate(value);
  if (!date) return 'غير محدد';

  return new Intl.DateTimeFormat('ar-SY', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function relativeTime(value: string | undefined): string {
  const date = safeDate(value);
  if (!date) return 'غير محدد';

  const diffMs = Date.now() - date.getTime();
  const abs = Math.abs(diffMs);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (abs < minute) return 'الآن';
  if (abs < hour) {
    const minutes = Math.max(1, Math.round(abs / minute));
    return diffMs >= 0 ? `منذ ${minutes} دقيقة` : `بعد ${minutes} دقيقة`;
  }
  if (abs < day) {
    const hours = Math.max(1, Math.round(abs / hour));
    return diffMs >= 0 ? `منذ ${hours} ساعة` : `بعد ${hours} ساعة`;
  }

  const days = Math.max(1, Math.round(abs / day));
  return diffMs >= 0 ? `منذ ${days} يوم` : `بعد ${days} يوم`;
}

function isToday(value: string | undefined): boolean {
  const date = safeDate(value);
  if (!date) return false;

  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function formatSyp(value: number): string {
  return `${value.toLocaleString('ar-SY')} ل.س`;
}

function daysUntil(value: string | undefined): number | null {
  const date = safeDate(value);
  if (!date) return null;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000));
}

async function fetchJson(path: string): Promise<unknown> {
  try {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) {
      return { __error: `${path}: ${response.status}` };
    }

    return await response.json();
  } catch {
    return { __error: `${path}: failed` };
  }
}

function collectError(payload: unknown): string | null {
  if (!isRecord(payload)) return null;
  const value = payload.__error;
  return typeof value === 'string' ? value : null;
}

function buildOrderNotifications(rows: Record<string, unknown>[]): NotificationItem[] {
  return rows.slice(0, 50).map((row) => {
    const id = getString(row, 'id', getString(row, 'order_number', crypto.randomUUID()));
    const orderNumber = getString(row, 'order_number', id);
    const status = getString(row, 'status', 'pending');
    const total = getNumber(row, 'total_syp', 0);
    const createdAt = getString(row, 'created_at', new Date().toISOString());
    const address = getNestedRecord(row, 'address_snapshot');
    const customer = getString(address, 'full_name', 'عميل غير محدد');
    const phone = getString(address, 'phone', '');

    let tone: Tone = 'neutral';
    let priority = 35;
    let title = `طلب ${ORDER_STATUS_AR[status] ?? status}`;

    if (status === 'pending') {
      tone = 'warning';
      priority = 95;
      title = 'طلب جديد بانتظار التأكيد';
    } else if (status === 'confirmed' || status === 'processing') {
      tone = 'info';
      priority = 75;
      title = 'طلب يحتاج متابعة التجهيز';
    } else if (status === 'shipped') {
      tone = 'success';
      priority = 55;
      title = 'طلب تم شحنه ويحتاج متابعة التسليم';
    } else if (status === 'cancelled') {
      tone = 'danger';
      priority = 80;
      title = 'طلب ملغى يحتاج مراجعة';
    }

    const actionHref = id ? `/orders/${id}` : '/orders';

    return {
      id: `order:${id}:${status}`,
      source: 'orders',
      tone,
      priority,
      title,
      description: `#${orderNumber} — ${customer}${phone ? ` — ${phone}` : ''}${total ? ` — ${formatSyp(total)}` : ''}`,
      createdAt,
      actionHref,
      actionLabel: 'فتح الطلب',
      badge: ORDER_STATUS_AR[status] ?? status,
      meta: [
        ['رقم الطلب', orderNumber],
        ['العميل', customer],
        ['الحالة', ORDER_STATUS_AR[status] ?? status],
        ['المجموع', total ? formatSyp(total) : 'غير محدد'],
        ['التاريخ', formatDateTime(createdAt)],
      ],
    };
  });
}

function buildExchangeNotifications(rows: Record<string, unknown>[]): NotificationItem[] {
  return rows.slice(0, 50).map((row) => {
    const id = getString(row, 'id', crypto.randomUUID());
    const status = getString(row, 'status', 'pending');
    const createdAt = getString(row, 'created_at', new Date().toISOString());
    const reason = getString(row, 'reason', getString(row, 'customer_reason', 'لم يتم تحديد السبب'));
    const orderId = getString(row, 'order_id', '');
    const customerName = getString(row, 'customer_name', getString(row, 'full_name', 'عميل غير محدد'));

    let tone: Tone = 'neutral';
    let priority = 40;
    let title = 'تحديث على طلب تبديل';

    if (status === 'pending' || status === 'requested') {
      tone = 'warning';
      priority = 92;
      title = 'طلب تبديل جديد بانتظار القرار';
    } else if (status === 'approved') {
      tone = 'info';
      priority = 70;
      title = 'طلب تبديل مقبول يحتاج إكمال';
    } else if (status === 'completed') {
      tone = 'success';
      priority = 45;
      title = 'طلب تبديل مكتمل';
    } else if (status === 'rejected' || status === 'cancelled') {
      tone = 'danger';
      priority = 50;
      title = 'طلب تبديل مغلق';
    }

    return {
      id: `exchange:${id}:${status}`,
      source: 'exchanges',
      tone,
      priority,
      title,
      description: `${customerName}${orderId ? ` — طلب مرتبط: ${orderId}` : ''} — ${reason}`,
      createdAt,
      actionHref: id ? `/exchanges/${id}` : '/exchanges',
      actionLabel: 'فتح التبديل',
      badge: EXCHANGE_STATUS_AR[status] ?? status,
      meta: [
        ['العميل', customerName],
        ['الحالة', EXCHANGE_STATUS_AR[status] ?? status],
        ['السبب', reason],
        ['الطلب المرتبط', orderId || 'غير محدد'],
        ['التاريخ', formatDateTime(createdAt)],
      ],
    };
  });
}

function buildDiscountNotifications(rows: Record<string, unknown>[]): NotificationItem[] {
  const items: NotificationItem[] = [];

  for (const row of rows.slice(0, 50)) {
    const id = getString(row, 'id', getString(row, 'code', crypto.randomUUID()));
    const code = getString(row, 'code', 'CODE');
    const value = getNumber(row, 'value', 0);
    const type = getString(row, 'type', 'percentage');
    const validUntil = getString(row, 'valid_until', '');
    const active = getBoolean(row, 'is_active', true);
    const usedCount = getNumber(row, 'used_count', 0);
    const maxUses = getNumber(row, 'max_uses', 0);
    const leftDays = daysUntil(validUntil);

    if (!active) {
      items.push({
        id: `discount:${id}:inactive`,
        source: 'discounts',
        tone: 'neutral',
        priority: 20,
        title: 'كود خصم معطّل',
        description: `${code} غير نشط حالياً`,
        createdAt: validUntil || new Date().toISOString(),
        actionHref: '/discounts',
        actionLabel: 'إدارة الخصومات',
        badge: 'معطّل',
        meta: [
          ['الكود', code],
          ['الحالة', 'معطّل'],
          ['القيمة', `${value}${type === 'percentage' ? '%' : ' ل.س'}`],
        ],
      });
      continue;
    }

    if (maxUses > 0 && usedCount >= maxUses) {
      items.push({
        id: `discount:${id}:used-up`,
        source: 'discounts',
        tone: 'danger',
        priority: 78,
        title: 'كود خصم استنفد عدد الاستخدامات',
        description: `${code} وصل إلى ${usedCount}/${maxUses} استخدام`,
        createdAt: validUntil || new Date().toISOString(),
        actionHref: '/discounts',
        actionLabel: 'إدارة الخصومات',
        badge: 'مستنفد',
        meta: [
          ['الكود', code],
          ['الاستخدامات', `${usedCount}/${maxUses}`],
          ['القيمة', `${value}${type === 'percentage' ? '%' : ' ل.س'}`],
        ],
      });
      continue;
    }

    if (leftDays !== null && leftDays < 0) {
      items.push({
        id: `discount:${id}:expired`,
        source: 'discounts',
        tone: 'danger',
        priority: 72,
        title: 'كود خصم منتهي الصلاحية',
        description: `${code} انتهى بتاريخ ${formatDateTime(validUntil)}`,
        createdAt: validUntil,
        actionHref: '/discounts',
        actionLabel: 'تحديث الكود',
        badge: 'منتهي',
        meta: [
          ['الكود', code],
          ['انتهى في', formatDateTime(validUntil)],
          ['الاستخدامات', maxUses ? `${usedCount}/${maxUses}` : String(usedCount)],
        ],
      });
      continue;
    }

    if (leftDays !== null && leftDays <= 7) {
      items.push({
        id: `discount:${id}:expiring:${leftDays}`,
        source: 'discounts',
        tone: 'warning',
        priority: 66,
        title: 'كود خصم يقترب من الانتهاء',
        description: `${code} ينتهي ${leftDays === 0 ? 'اليوم' : `بعد ${leftDays} يوم`}`,
        createdAt: validUntil,
        actionHref: '/discounts',
        actionLabel: 'مراجعة الكود',
        badge: 'قريب الانتهاء',
        meta: [
          ['الكود', code],
          ['ينتهي في', formatDateTime(validUntil)],
          ['القيمة', `${value}${type === 'percentage' ? '%' : ' ل.س'}`],
          ['الاستخدامات', maxUses ? `${usedCount}/${maxUses}` : String(usedCount)],
        ],
      });
    }
  }

  return items;
}

function buildCustomerNotifications(rows: Record<string, unknown>[]): NotificationItem[] {
  const now = Date.now();
  const twoDays = 2 * 24 * 60 * 60 * 1000;

  return rows
    .slice(0, 50)
    .filter((row) => {
      const createdAt = safeDate(getString(row, 'created_at', ''));
      if (!createdAt) return false;
      return now - createdAt.getTime() <= twoDays;
    })
    .map((row) => {
      const id = getString(row, 'id', crypto.randomUUID());
      const name = getString(row, 'full_name', 'عميل جديد');
      const phone = getString(row, 'phone', '');
      const email = getString(row, 'email', '');
      const createdAt = getString(row, 'created_at', new Date().toISOString());
      const points = getNumber(row, 'loyalty_points', 0);

      return {
        id: `customer:${id}`,
        source: 'customers',
        tone: 'success',
        priority: 42,
        title: 'عميل جديد انضم للمتجر',
        description: `${name}${phone ? ` — ${phone}` : ''}${email ? ` — ${email}` : ''}`,
        createdAt,
        actionHref: '/customers',
        actionLabel: 'فتح العملاء',
        badge: 'جديد',
        meta: [
          ['الاسم', name],
          ['الهاتف', phone || 'غير محدد'],
          ['البريد', email || 'غير محدد'],
          ['النقاط', String(points)],
          ['التاريخ', formatDateTime(createdAt)],
        ],
      } satisfies NotificationItem;
    });
}

function buildAuditNotifications(rows: Record<string, unknown>[]): NotificationItem[] {
  return rows.slice(0, 40).map((row) => {
    const id = getString(row, 'id', crypto.randomUUID());
    const action = getString(row, 'action', 'update');
    const entityType = getString(row, 'entity_type', 'system');
    const entityId = getString(row, 'entity_id', '');
    const createdAt = getString(row, 'created_at', new Date().toISOString());

    let tone: Tone = 'info';
    let priority = 25;

    if (action.includes('delete')) {
      tone = 'danger';
      priority = 64;
    } else if (action.includes('create')) {
      tone = 'success';
      priority = 36;
    } else if (action.includes('login')) {
      tone = 'neutral';
      priority = 22;
    }

    return {
      id: `audit:${id}:${action}`,
      source: 'audit',
      tone,
      priority,
      title: `${ACTION_AR[action] ?? action} في ${entityType}`,
      description: entityId ? `تمت العملية على المعرّف: ${entityId}` : 'عملية إدارية مسجلة في سجل النشاطات',
      createdAt,
      actionHref: '/audit-logs',
      actionLabel: 'فتح سجل النشاطات',
      badge: ACTION_AR[action] ?? action,
      meta: [
        ['العملية', ACTION_AR[action] ?? action],
        ['الكيان', entityType],
        ['المعرّف', entityId || 'غير محدد'],
        ['التاريخ', formatDateTime(createdAt)],
      ],
    };
  });
}

function buildSystemNotifications(errors: string[]): NotificationItem[] {
  if (errors.length === 0) return [];

  return [
    {
      id: `system:api-errors:${errors.join('|')}`,
      source: 'system',
      tone: 'warning',
      priority: 88,
      title: 'بعض مصادر التنبيهات لم تستجب',
      description: 'المركز يعمل، لكن بعض واجهات API لم ترجع بيانات. راجع اتصال السيرفر أو الجلسة الإدارية.',
      createdAt: new Date().toISOString(),
      actionHref: '/settings',
      actionLabel: 'فتح الإعدادات',
      badge: 'اتصال',
      meta: errors.slice(0, 6).map((error, index) => [`مصدر ${index + 1}`, error]),
    },
  ];
}

function sortNotifications(items: NotificationItem[]): NotificationItem[] {
  return [...items].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    const aDate = safeDate(a.createdAt)?.getTime() ?? 0;
    const bDate = safeDate(b.createdAt)?.getTime() ?? 0;
    return bDate - aDate;
  });
}

export default function AdminNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [tab, setTab] = useState<TabKey>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<NotificationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setReadIds(parsed.filter((value): value is string => typeof value === 'string'));
      }
    } catch {
      setReadIds([]);
    }
  }, []);

  const persistReadIds = useCallback((next: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, 700)));
    } catch {
      // localStorage can be blocked; the page should still work.
    }
  }, []);

  const markRead = useCallback(
    (id: string) => {
      setReadIds((current) => {
        if (current.includes(id)) return current;
        const next = [id, ...current].slice(0, 700);
        persistReadIds(next);
        return next;
      });
    },
    [persistReadIds],
  );

  const markAllRead = useCallback(() => {
    const next = items.map((item) => item.id).slice(0, 700);
    setReadIds(next);
    persistReadIds(next);
  }, [items, persistReadIds]);

  const resetRead = useCallback(() => {
    setReadIds([]);
    persistReadIds([]);
  }, [persistReadIds]);

  const load = useCallback(async () => {
    setRefreshing(true);
    setError('');

    try {
      const [ordersPayload, exchangesPayload, auditPayload, discountsPayload, customersPayload] =
        await Promise.all([
          fetchJson('/api/orders?limit=50'),
          fetchJson('/api/exchanges?limit=50'),
          fetchJson('/api/audit-logs?limit=50'),
          fetchJson('/api/discounts'),
          fetchJson('/api/customers?limit=50'),
        ]);

      const errors = [
        collectError(ordersPayload),
        collectError(exchangesPayload),
        collectError(auditPayload),
        collectError(discountsPayload),
        collectError(customersPayload),
      ].filter((value): value is string => typeof value === 'string');

      const generated = sortNotifications([
        ...buildOrderNotifications(pickArray(ordersPayload, ['orders', 'data', 'items'])),
        ...buildExchangeNotifications(pickArray(exchangesPayload, ['exchanges', 'data', 'items'])),
        ...buildAuditNotifications(pickArray(auditPayload, ['logs', 'audit_logs', 'data', 'items'])),
        ...buildDiscountNotifications(pickArray(discountsPayload, ['discounts', 'data', 'items'])),
        ...buildCustomerNotifications(pickArray(customersPayload, ['customers', 'data', 'items'])),
        ...buildSystemNotifications(errors),
      ]);

      setItems(generated);
      setLastRefresh(new Date().toISOString());
    } catch {
      setError('تعذر تحميل التنبيهات حالياً. تحقق من تشغيل سيرفر الآدمن وتسجيل الدخول.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();

    const interval = window.setInterval(() => {
      void load();
    }, 60000);

    return () => window.clearInterval(interval);
  }, [load]);

  const unreadIds = useMemo(() => new Set(readIds), [readIds]);

  const stats = useMemo(() => {
    const unread = items.filter((item) => !unreadIds.has(item.id)).length;
    const urgent = items.filter((item) => item.tone === 'danger' || item.priority >= 85).length;
    const today = items.filter((item) => isToday(item.createdAt)).length;
    const orders = items.filter((item) => item.source === 'orders').length;
    const exchanges = items.filter((item) => item.source === 'exchanges').length;

    return {
      total: items.length,
      unread,
      urgent,
      today,
      orders,
      exchanges,
    };
  }, [items, unreadIds]);

  const tabs = useMemo<{ key: TabKey; label: string; count: number }[]>(
    () => [
      { key: 'all', label: 'الكل', count: items.length },
      { key: 'unread', label: 'غير مقروءة', count: stats.unread },
      { key: 'orders', label: 'الطلبات', count: items.filter((item) => item.source === 'orders').length },
      { key: 'exchanges', label: 'التبديلات', count: items.filter((item) => item.source === 'exchanges').length },
      { key: 'customers', label: 'العملاء', count: items.filter((item) => item.source === 'customers').length },
      { key: 'discounts', label: 'الخصومات', count: items.filter((item) => item.source === 'discounts').length },
      { key: 'audit', label: 'السجل', count: items.filter((item) => item.source === 'audit').length },
      { key: 'system', label: 'النظام', count: items.filter((item) => item.source === 'system').length },
    ],
    [items, stats.unread],
  );

  const visibleItems = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      if (tab === 'unread' && unreadIds.has(item.id)) return false;
      if (tab !== 'all' && tab !== 'unread' && item.source !== tab) return false;

      if (!trimmedQuery) return true;

      return (
        item.title.toLowerCase().includes(trimmedQuery) ||
        item.description.toLowerCase().includes(trimmedQuery) ||
        (item.badge ?? '').toLowerCase().includes(trimmedQuery) ||
        SOURCE_AR[item.source].toLowerCase().includes(trimmedQuery)
      );
    });
  }, [items, query, tab, unreadIds]);

  const mostImportant = useMemo(() => visibleItems.slice(0, 3), [visibleItems]);

  const openNotification = (item: NotificationItem) => {
    markRead(item.id);
    setSelected(item);
  };

  return (
    <div className="min-h-screen space-y-6 bg-[#F8F6F2]" dir="rtl">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#E5E0D8] bg-[#121414] p-6 text-white shadow-sm">
        <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[#B8860B]/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-10 h-56 w-56 rounded-full bg-[#E8D28A]/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[#E8D28A]">EuroStore Admin</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">مركز الإشعارات والتنبيهات</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#D0C5B2]">
              نافذة موحدة لمتابعة الطلبات، التبديلات، الخصومات، العملاء، وسجل العمليات الإدارية بدون مغادرة لوحة الإدارة.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#D0C5B2]">
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">تحديث تلقائي كل دقيقة</span>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                آخر تحديث: {lastRefresh ? relativeTime(lastRefresh) : 'جارٍ التحميل'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void load()}
              disabled={refreshing}
              className="rounded-2xl border border-white/15 bg-white px-5 py-3 text-sm font-black text-[#1C1917] shadow-lg shadow-black/10 transition hover:bg-[#E8D28A] disabled:opacity-60"
            >
              {refreshing ? 'جارٍ التحديث...' : 'تحديث الآن ↻'}
            </button>
            <button
              onClick={markAllRead}
              disabled={items.length === 0}
              className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20 disabled:opacity-50"
            >
              تعليم الكل كمقروء
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ['غير مقروءة', stats.unread, 'رسالة تحتاج انتباهك', 'bg-[#FFF7DF] text-[#8A6400]'],
          ['عاجلة', stats.urgent, 'تنبيهات عالية الأولوية', 'bg-red-50 text-red-700'],
          ['اليوم', stats.today, 'نشاطات خلال اليوم', 'bg-blue-50 text-blue-700'],
          ['طلبات', stats.orders, 'حركة الطلبات', 'bg-emerald-50 text-emerald-700'],
          ['تبديلات', stats.exchanges, 'طلبات التبديل', 'bg-purple-50 text-purple-700'],
        ].map(([label, value, desc, tone]) => (
          <div key={label} className="rounded-3xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
            <div className={`inline-flex rounded-2xl px-3 py-1 text-xs font-black ${tone}`}>{label}</div>
            <div className="mt-4 text-3xl font-black text-[#1C1917]">{value}</div>
            <p className="mt-1 text-xs font-medium text-[#A8A29E]">{desc}</p>
          </div>
        ))}
      </section>

      {mostImportant.length > 0 && (
        <section className="rounded-3xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#1C1917]">أهم التنبيهات الآن</h2>
              <p className="mt-1 text-xs text-[#A8A29E]">مرتبة حسب الأولوية ثم الوقت</p>
            </div>
            <span className="rounded-full border border-[#E5E0D8] bg-[#F8F6F2] px-3 py-1 text-xs font-bold text-[#57534E]">
              {mostImportant.length} عناصر
            </span>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {mostImportant.map((item) => {
              const tone = TONE_STYLE[item.tone];
              const read = unreadIds.has(item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => openNotification(item)}
                  className={`rounded-3xl border p-4 text-right transition hover:-translate-y-0.5 hover:shadow-md ${tone.card} ${
                    read ? 'opacity-70' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg ring-1 ${tone.icon}`}>
                      {SOURCE_ICON[item.source]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        {!read && <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />}
                        <span className="truncate text-sm font-black text-[#1C1917]">{item.title}</span>
                      </span>
                      <span className="mt-1 line-clamp-2 block text-xs leading-6 text-[#57534E]">{item.description}</span>
                      <span className="mt-3 flex flex-wrap gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${tone.badge}`}>
                          {item.badge ?? tone.label}
                        </span>
                        <span className="rounded-full border border-[#E5E0D8] bg-white/70 px-2.5 py-1 text-[11px] font-bold text-[#78716C]">
                          {relativeTime(item.createdAt)}
                        </span>
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`whitespace-nowrap rounded-2xl border px-4 py-2 text-xs font-black transition ${
                  tab === item.key
                    ? 'border-[#B8860B] bg-[#B8860B] text-white shadow-sm'
                    : 'border-[#E5E0D8] bg-[#FAFAF8] text-[#57534E] hover:border-[#B8860B]'
                }`}
              >
                {item.label}
                <span className="ms-2 rounded-full bg-white/60 px-2 py-0.5 text-[10px] text-inherit">{item.count}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="بحث داخل التنبيهات..."
              className="w-full rounded-2xl border border-[#E5E0D8] bg-[#FAFAF8] px-4 py-2.5 text-sm outline-none transition focus:border-[#B8860B] sm:w-72"
            />
            <button
              onClick={resetRead}
              className="rounded-2xl border border-[#E5E0D8] px-4 py-2.5 text-xs font-bold text-[#57534E] transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            >
              إعادة إظهار غير المقروء
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-[#E5E0D8] bg-white shadow-sm">
        <div className="border-b border-[#F0ECE6] px-5 py-4">
          <h2 className="font-black text-[#1C1917]">قائمة الإشعارات</h2>
          <p className="mt-1 text-xs text-[#A8A29E]">
            اضغط على أي إشعار لفتح نافذة التفاصيل، أو استخدم زر الإجراء للانتقال للقسم المناسب.
          </p>
        </div>

        {loading ? (
          <div className="grid min-h-[360px] place-items-center p-10 text-center">
            <div>
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#E5E0D8] border-t-[#B8860B]" />
              <p className="mt-4 text-sm font-bold text-[#57534E]">جارٍ تحميل مركز التنبيهات...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-red-50 text-3xl">⚠️</div>
            <h3 className="mt-4 font-black text-[#1C1917]">حدث خطأ</h3>
            <p className="mt-2 text-sm text-[#78716C]">{error}</p>
            <button
              onClick={() => void load()}
              className="mt-5 rounded-2xl bg-[#B8860B] px-5 py-2.5 text-sm font-black text-white"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="grid min-h-[360px] place-items-center p-10 text-center">
            <div>
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-[2rem] bg-[#F8F6F2] text-4xl">🔔</div>
              <h3 className="mt-5 text-xl font-black text-[#1C1917]">لا توجد تنبيهات مطابقة</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#78716C]">
                لا توجد عناصر ضمن الفلتر الحالي. جرّب تغيير التبويب، أو امسح البحث، أو اضغط تحديث الآن لجلب آخر البيانات.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#F0ECE6]">
            {visibleItems.map((item) => {
              const tone = TONE_STYLE[item.tone];
              const read = unreadIds.has(item.id);

              return (
                <div
                  key={item.id}
                  className={`group flex flex-col gap-4 p-5 transition hover:bg-[#FFFBF0] lg:flex-row lg:items-center ${
                    read ? 'opacity-70' : ''
                  }`}
                >
                  <button onClick={() => openNotification(item)} className="min-w-0 flex-1 text-right">
                    <div className="flex items-start gap-4">
                      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-lg ring-1 ${tone.icon}`}>
                        {SOURCE_ICON[item.source]}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          {!read && <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />}
                          <span className="font-black text-[#1C1917] group-hover:text-[#B8860B]">{item.title}</span>
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${tone.badge}`}>
                            {item.badge ?? tone.label}
                          </span>
                          <span className="rounded-full border border-[#E5E0D8] bg-[#FAFAF8] px-2.5 py-1 text-[11px] font-bold text-[#78716C]">
                            {SOURCE_AR[item.source]}
                          </span>
                        </span>

                        <span className="mt-1 block text-sm leading-7 text-[#57534E]">{item.description}</span>
                        <span className="mt-2 block text-xs text-[#A8A29E]">{formatDateTime(item.createdAt)} — {relativeTime(item.createdAt)}</span>
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 self-start lg:self-center">
                    <button
                      onClick={() => markRead(item.id)}
                      className="rounded-xl border border-[#E5E0D8] px-3 py-2 text-xs font-bold text-[#57534E] transition hover:border-[#B8860B] hover:text-[#B8860B]"
                    >
                      {read ? 'مقروء' : 'تعليم كمقروء'}
                    </button>

                    {item.actionHref && (
                      <Link
                        href={item.actionHref}
                        onClick={() => markRead(item.id)}
                        className="rounded-xl bg-[#1C1917] px-3 py-2 text-xs font-black text-white transition hover:bg-[#B8860B]"
                      >
                        {item.actionLabel ?? 'فتح'}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-[#E5E0D8] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative overflow-hidden bg-[#121414] p-6 text-white">
              <div className="pointer-events-none absolute -left-20 -top-20 h-44 w-44 rounded-full bg-[#B8860B]/30 blur-3xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-3xl text-2xl ring-1 ${TONE_STYLE[selected.tone].icon}`}>
                    {SOURCE_ICON[selected.source]}
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-[#E8D28A]">{SOURCE_AR[selected.source]}</p>
                    <h3 className="mt-2 text-xl font-black leading-8 text-white">{selected.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[#D0C5B2]">{selected.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelected(null)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/10 text-xl text-white transition hover:bg-white/20"
                  aria-label="إغلاق"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#E5E0D8] bg-[#FAFAF8] p-4">
                  <p className="text-xs font-bold text-[#A8A29E]">الأولوية</p>
                  <p className="mt-1 font-black text-[#1C1917]">{TONE_STYLE[selected.tone].label}</p>
                </div>
                <div className="rounded-2xl border border-[#E5E0D8] bg-[#FAFAF8] p-4">
                  <p className="text-xs font-bold text-[#A8A29E]">الوقت</p>
                  <p className="mt-1 font-black text-[#1C1917]">{formatDateTime(selected.createdAt)}</p>
                </div>
              </div>

              {selected.meta && selected.meta.length > 0 && (
                <div className="mt-5 rounded-3xl border border-[#E5E0D8] bg-white">
                  <div className="border-b border-[#F0ECE6] px-5 py-4">
                    <h4 className="font-black text-[#1C1917]">تفاصيل الإشعار</h4>
                  </div>
                  <div className="divide-y divide-[#F0ECE6]">
                    {selected.meta.map(([label, value]) => (
                      <div key={`${label}-${value}`} className="flex items-start justify-between gap-5 px-5 py-3 text-sm">
                        <span className="text-[#A8A29E]">{label}</span>
                        <span className="max-w-[65%] text-left font-bold text-[#1C1917]" dir="auto">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                {selected.actionHref && (
                  <Link
                    href={selected.actionHref}
                    onClick={() => {
                      markRead(selected.id);
                      setSelected(null);
                    }}
                    className="flex-1 rounded-2xl bg-[#B8860B] px-5 py-3 text-center text-sm font-black text-white transition hover:bg-[#9A7209]"
                  >
                    {selected.actionLabel ?? 'فتح القسم'}
                  </Link>
                )}
                <button
                  onClick={() => {
                    markRead(selected.id);
                    setSelected(null);
                  }}
                  className="rounded-2xl border border-[#E5E0D8] px-5 py-3 text-sm font-bold text-[#57534E] transition hover:border-[#B8860B] hover:text-[#B8860B]"
                >
                  تم الاطلاع
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}