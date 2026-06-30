'use client';

import Link from 'next/link';
import { Bell, ClipboardList, RefreshCw, ShoppingBag, Undo2, Users, Package, Percent } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Stats = {
  orders: number;
  revenue_syp: number;
  customers: number;
  products: number;
  pending_exchanges: number;
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  total_syp: number;
  created_at: string;
  address_snapshot?: { full_name?: string } | null;
};

type ExchangeRequest = {
  id: string;
  status: string;
  reason_ar?: string | null;
  created_at: string;
};

const EMPTY_STATS: Stats = {
  orders: 0,
  revenue_syp: 0,
  customers: 0,
  products: 0,
  pending_exchanges: 0,
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const payload = (await res.json().catch(() => null)) as T | { error?: string } | null;
  if (!res.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && payload.error
        ? String(payload.error)
        : 'request_failed';
    throw new Error(message);
  }
  return payload as T;
}

function money(value: number) {
  return `${Number(value || 0).toLocaleString('ar-SY')} ل.س`;
}

function dateText(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('ar-SY', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function statusLabel(value: string) {
  const labels: Record<string, string> = {
    pending: 'قيد الانتظار',
    confirmed: 'مؤكد',
    processing: 'جار التجهيز',
    shipped: 'تم الشحن',
    delivered: 'تم التسليم',
    cancelled: 'ملغى',
    approved: 'مقبول',
    rejected: 'مرفوض',
    completed: 'مكتمل',
  };
  return labels[value] ?? value;
}

export default function DashboardQuickAdmin() {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [exchanges, setExchanges] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setMsg('');
    Promise.all([
      fetchJson<Stats>('/api/dashboard/stats'),
      fetchJson<{ orders: Order[] }>('/api/orders?limit=6'),
      fetchJson<ExchangeRequest[]>('/api/exchanges?status=pending'),
    ])
      .then(([nextStats, orderPayload, exchangePayload]) => {
        setStats({ ...EMPTY_STATS, ...nextStats });
        setOrders(Array.isArray(orderPayload.orders) ? orderPayload.orders : []);
        setExchanges(Array.isArray(exchangePayload) ? exchangePayload.slice(0, 6) : []);
      })
      .catch((error) => setMsg(error instanceof Error ? error.message : 'تعذر تحميل لوحة التحكم'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cards = useMemo(() => [
    { label: 'الإيرادات', value: money(stats.revenue_syp), href: '/orders', icon: ShoppingBag },
    { label: 'الطلبات', value: stats.orders.toLocaleString('ar-SY'), href: '/orders', icon: ClipboardList },
    { label: 'العملاء', value: stats.customers.toLocaleString('ar-SY'), href: '/customers', icon: Users },
    { label: 'المنتجات', value: stats.products.toLocaleString('ar-SY'), href: '/products', icon: Package },
    { label: 'الاستبدالات', value: stats.pending_exchanges.toLocaleString('ar-SY'), href: '/exchanges', icon: Undo2 },
  ], [stats]);

  return (
    <div className="space-y-5" dir="rtl">
      <section className="flex flex-col gap-4 rounded-lg border border-[#E5E0D8] bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1C1917]">لوحة التحكم</h1>
          <p className="mt-1 text-sm text-[#8B8172]">{loading ? 'جار تحميل البيانات' : 'جاهزة'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/notifications" className="inline-flex items-center gap-2 rounded-lg border border-[#E5E0D8] px-4 py-2 text-sm font-bold text-[#57534E] hover:border-[#B8860B]">
            <Bell size={16} /> الإشعارات
          </Link>
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg bg-[#1C1917] px-4 py-2 text-sm font-black text-white hover:bg-[#B8860B]">
            <RefreshCw size={16} /> تحديث
          </button>
        </div>
      </section>

      {msg ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{msg}</div> : null}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href} className="rounded-lg border border-[#E5E0D8] bg-white p-4 shadow-sm transition hover:border-[#B8860B] hover:bg-[#FFFBF0]">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#F8F6F2] text-[#B8860B]"><Icon size={18} /></span>
                <span className="text-xs font-bold text-[#8B8172]">فتح</span>
              </div>
              <p className="mt-4 text-2xl font-black text-[#1C1917]">{loading ? '...' : card.value}</p>
              <p className="mt-1 text-sm font-bold text-[#57534E]">{card.label}</p>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-[#E5E0D8] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#F0ECE6] px-4 py-3">
            <h2 className="font-black text-[#1C1917]">آخر الطلبات</h2>
            <Link href="/orders" className="text-xs font-black text-[#B8860B]">الكل</Link>
          </div>
          <div className="divide-y divide-[#F0ECE6]">
            {orders.length === 0 ? <p className="p-5 text-center text-sm text-[#A8A29E]">لا توجد طلبات</p> : orders.map((order) => (
              <Link key={order.id} href={`/orders?open=${order.id}`} className="grid gap-1 p-4 transition hover:bg-[#FFFBF0]">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-black text-[#1C1917]">#{order.order_number}</span>
                  <span className="rounded-full border border-[#E5E0D8] bg-[#F8F6F2] px-3 py-1 text-xs font-bold text-[#57534E]">{statusLabel(order.status)}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-[#8B8172]">
                  <span>{order.address_snapshot?.full_name || 'عميل غير محدد'}</span>
                  <span>{money(order.total_syp)}</span>
                  <span>{dateText(order.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-[#E5E0D8] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#F0ECE6] px-4 py-3">
            <h2 className="font-black text-[#1C1917]">استبدالات بانتظار القرار</h2>
            <Link href="/exchanges" className="text-xs font-black text-[#B8860B]">الكل</Link>
          </div>
          <div className="divide-y divide-[#F0ECE6]">
            {exchanges.length === 0 ? <p className="p-5 text-center text-sm text-[#A8A29E]">لا توجد طلبات معلقة</p> : exchanges.map((request) => (
              <Link key={request.id} href={`/exchanges?open=${request.id}`} className="grid gap-1 p-4 transition hover:bg-[#FFFBF0]">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm font-black text-[#1C1917]" dir="ltr">#{request.id.slice(0, 8)}</span>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{statusLabel(request.status)}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-[#8B8172]">
                  <span>{request.reason_ar || 'بدون سبب'}</span>
                  <span>{dateText(request.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { href: '/products/new', label: 'منتج جديد', Icon: Package },
          { href: '/discounts', label: 'كود خصم', Icon: Percent },
          { href: '/audit-logs', label: 'سجل النشاط', Icon: ClipboardList },
          { href: '/settings', label: 'الإعدادات', Icon: RefreshCw },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg border border-[#E5E0D8] bg-white p-4 text-sm font-black text-[#1C1917] shadow-sm transition hover:border-[#B8860B] hover:bg-[#FFFBF0]">
            <item.Icon size={17} className="text-[#B8860B]" />
            {item.label}
          </Link>
        ))}
      </section>
    </div>
  );
}
