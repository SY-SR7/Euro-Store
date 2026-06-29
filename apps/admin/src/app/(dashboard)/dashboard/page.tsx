'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Stats = {
  orders: number;
  pendingOrders: number;
  customers: number;
  exchanges: number;
  discounts: number;
  notifications: number;
};

const EMPTY_STATS: Stats = {
  orders: 0,
  pendingOrders: 0,
  customers: 0,
  exchanges: 0,
  discounts: 0,
  notifications: 0,
};

const QUICK_LINKS = [
  {
    href: '/orders',
    title: 'الطلبات',
    desc: 'متابعة الطلبات وتغيير حالاتها',
    icon: '🛒',
  },
  {
    href: '/notifications',
    title: 'الإشعارات',
    desc: 'مركز التنبيهات والمهام المهمة',
    icon: '🔔',
  },
  {
    href: '/products',
    title: 'المنتجات',
    desc: 'إدارة المنتجات والمخزون',
    icon: '📦',
  },
  {
    href: '/customers',
    title: 'العملاء',
    desc: 'إدارة بيانات العملاء ونقاط الولاء',
    icon: '👤',
  },
  {
    href: '/discounts',
    title: 'الخصومات',
    desc: 'أكواد الخصم والعروض',
    icon: '%',
  },
  {
    href: '/audit-logs',
    title: 'سجل النشاط',
    desc: 'كل حركات الآدمن بالتفصيل',
    icon: '🧾',
  },
];

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

function pickTotal(payload: unknown, keys: string[], fallback: Record<string, unknown>[]) {
  if (isRecord(payload)) {
    for (const key of ['total', 'count', 'total_count', 'totalCount']) {
      const numberValue = Number(payload[key]);
      if (Number.isFinite(numberValue)) return numberValue;
    }

    for (const key of keys) {
      const value = payload[key];
      if (Array.isArray(value)) return value.length;
    }
  }

  return fallback.length;
}

async function fetchJson(path: string): Promise<unknown> {
  try {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const [
        ordersPayload,
        customersPayload,
        exchangesPayload,
        discountsPayload,
        auditPayload,
      ] = await Promise.all([
        fetchJson('/api/orders?limit=50'),
        fetchJson('/api/customers?limit=50'),
        fetchJson('/api/exchanges?limit=50'),
        fetchJson('/api/discounts'),
        fetchJson('/api/audit-logs?limit=50'),
      ]);

      if (cancelled) return;

      const orders = pickArray(ordersPayload, ['orders', 'data', 'items']);
      const customers = pickArray(customersPayload, ['customers', 'data', 'items']);
      const exchanges = pickArray(exchangesPayload, ['exchanges', 'data', 'items']);
      const discounts = pickArray(discountsPayload, ['discounts', 'data', 'items']);
      const logs = pickArray(auditPayload, ['logs', 'data', 'items', 'audit_logs']);

      setStats({
        orders: pickTotal(ordersPayload, ['orders', 'data', 'items'], orders),
        pendingOrders: orders.filter((order) => String(order.status ?? '') === 'pending').length,
        customers: pickTotal(customersPayload, ['customers', 'data', 'items'], customers),
        exchanges: pickTotal(exchangesPayload, ['exchanges', 'data', 'items'], exchanges),
        discounts: pickTotal(discountsPayload, ['discounts', 'data', 'items'], discounts),
        notifications: logs.length,
      });

      setLastRefresh(new Date().toLocaleString('ar-SY'));
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const cards = useMemo(
    () => [
      {
        label: 'إجمالي الطلبات',
        value: stats.orders,
        desc: 'كل الطلبات المسجلة في المتجر',
        icon: '🛒',
        href: '/orders',
        tone: 'bg-[#FFF7DF] text-[#8A6400]',
      },
      {
        label: 'طلبات بانتظار التأكيد',
        value: stats.pendingOrders,
        desc: 'تحتاج متابعة سريعة',
        icon: '⏳',
        href: '/orders',
        tone: 'bg-amber-50 text-amber-700',
      },
      {
        label: 'العملاء',
        value: stats.customers,
        desc: 'عدد العملاء المسجلين',
        icon: '👤',
        href: '/customers',
        tone: 'bg-blue-50 text-blue-700',
      },
      {
        label: 'التبديلات',
        value: stats.exchanges,
        desc: 'طلبات الاستبدال والاسترجاع',
        icon: '↔',
        href: '/exchanges',
        tone: 'bg-purple-50 text-purple-700',
      },
      {
        label: 'أكواد الخصم',
        value: stats.discounts,
        desc: 'العروض والكوبونات',
        icon: '%',
        href: '/discounts',
        tone: 'bg-emerald-50 text-emerald-700',
      },
      {
        label: 'حركات مسجلة',
        value: stats.notifications,
        desc: 'آخر عناصر سجل النشاط',
        icon: '🧾',
        href: '/audit-logs',
        tone: 'bg-neutral-100 text-neutral-700',
      },
    ],
    [stats],
  );

  return (
    <div className="space-y-6" dir="rtl">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#E5E0D8] bg-[#121414] p-6 text-white shadow-sm">
        <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-[#B8860B]/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-20 h-60 w-60 rounded-full bg-[#E8D28A]/20 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[#E8D28A]">EuroStore Admin</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">لوحة التحكم</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#D0C5B2]">
              صفحة لوحة التحكم أصبحت الآن داخل مسار /dashboard الصحيح، وستظهر مع النافبار والسايدبار الثابتين.
            </p>
            <p className="mt-3 text-xs font-bold text-[#D0C5B2]">
              {loading ? 'جارٍ تحميل الإحصائيات...' : `آخر تحديث: ${lastRefresh || 'الآن'}`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/notifications"
              className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#1C1917] shadow-lg shadow-black/10 transition hover:bg-[#E8D28A]"
            >
              فتح الإشعارات
            </Link>
            <Link
              href="/orders"
              className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
            >
              متابعة الطلبات
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-3xl border border-[#E5E0D8] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#B8860B] hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-3">
              <span className={`grid h-12 w-12 place-items-center rounded-2xl text-lg font-black ${card.tone}`}>
                {card.icon}
              </span>
              <span className="rounded-full border border-[#E5E0D8] bg-[#F8F6F2] px-3 py-1 text-[11px] font-black text-[#57534E]">
                عرض
              </span>
            </div>

            <div className="mt-5 text-3xl font-black text-[#1C1917]">
              {loading ? '...' : card.value.toLocaleString('ar-SY')}
            </div>
            <div className="mt-1 text-sm font-black text-[#1C1917]">{card.label}</div>
            <p className="mt-1 text-xs leading-6 text-[#A8A29E]">{card.desc}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-3xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-black text-[#1C1917]">اختصارات الإدارة</h2>
          <p className="mt-1 text-xs text-[#A8A29E]">روابط سريعة لأهم أقسام لوحة الآدمن</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {QUICK_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-start gap-4 rounded-3xl border border-[#E5E0D8] bg-[#FAFAF8] p-4 transition hover:border-[#B8860B] hover:bg-[#FFFBF0]"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-lg shadow-sm transition group-hover:bg-[#B8860B] group-hover:text-white">
                {item.icon}
              </span>
              <span>
                <span className="block font-black text-[#1C1917] group-hover:text-[#B8860B]">{item.title}</span>
                <span className="mt-1 block text-xs leading-6 text-[#78716C]">{item.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}