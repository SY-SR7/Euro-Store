'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { formatSYP } from '@eurostore/shared';
import {
  ArrowUpRight,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users
} from 'lucide-react';

type DashboardStats = {
  total_orders?: number;
  total_revenue_syp?: number;
  total_customers?: number;
  pending_exchanges?: number;
  total_products?: number;
};

type ProductRow = {
  id: string;
};

type RecentOrder = {
  id: string;
  order_number: string;
  status: string;
  total_syp: number;
  created_at: string;
  address_snapshot?: {
    full_name?: string;
    governorate?: string;
  };
};

type OrdersResponse =
  | RecentOrder[]
  | {
      data?: RecentOrder[];
      total?: number;
    };

const EMPTY_STATS: Required<DashboardStats> = {
  total_orders: 0,
  total_revenue_syp: 0,
  total_customers: 0,
  pending_exchanges: 0,
  total_products: 0
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-400/10 text-yellow-200 border-yellow-400/20',
  confirmed: 'bg-blue-400/10 text-blue-200 border-blue-400/20',
  processing: 'bg-purple-400/10 text-purple-200 border-purple-400/20',
  shipped: 'bg-indigo-400/10 text-indigo-200 border-indigo-400/20',
  delivered: 'bg-green-400/10 text-green-200 border-green-400/20',
  completed: 'bg-green-400/10 text-green-200 border-green-400/20',
  cancelled: 'bg-red-400/10 text-red-200 border-red-400/20'
};

async function readJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

function normalizeOrders(payload: OrdersResponse): RecentOrder[] {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload.data) ? payload.data : [];
}

function statusKey(status: string) {
  const normalized = status.trim().toLowerCase();
  return `orders.status${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
}

export default function AdminDashboardPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [stats, setStats] = useState<Required<DashboardStats>>(EMPTY_STATS);
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const numberLocale = locale === 'ar' ? 'ar-SY' : 'en-US';

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);

      const [statsData, productsData, ordersData] = await Promise.all([
        readJson<DashboardStats>('/api/dashboard/stats', {}),
        readJson<ProductRow[]>('/api/catalog/products', []),
        readJson<OrdersResponse>('/api/orders?page=1&limit=8', { data: [] })
      ]);

      if (!mounted) return;

      setStats({
        ...EMPTY_STATS,
        ...statsData,
        total_products: Array.isArray(productsData)
          ? productsData.length
          : statsData.total_products ?? 0
      });

      setOrders(normalizeOrders(ordersData));
      setLoading(false);
    }

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const statCards = useMemo(
    () => [
      {
        label: t('admin.customersLabel'),
        value: stats.total_customers.toLocaleString(numberLocale),
        href: '/customers',
        icon: Users
      },
      {
        label: t('admin.productsLabel'),
        value: stats.total_products.toLocaleString(numberLocale),
        href: '/products',
        icon: Package
      },
      {
        label: t('admin.ordersLabel'),
        value: stats.total_orders.toLocaleString(numberLocale),
        href: '/orders',
        icon: ShoppingCart
      },
      {
        label: t('admin.revenueLabel'),
        value: formatSYP(stats.total_revenue_syp),
        href: '/orders',
        icon: TrendingUp
      },
      {
        label: t('admin.exchangesLabel'),
        value: stats.pending_exchanges.toLocaleString(numberLocale),
        href: '/exchanges',
        icon: RefreshCw
      }
    ],
    [numberLocale, stats, t]
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-[#151515] to-[#0B0B0B] p-6 shadow-2xl md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold tracking-[0.25em] text-[#C9A84C]">EUROSTORE</p>
          <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">
            {t('admin.dashboardTitle')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#B8B1A4]">
            {t('admin.dashboardSubtitle')}
          </p>
        </div>

        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C9A84C] px-5 py-3 text-sm font-bold text-[#111111] transition hover:bg-[#D9B95F]"
        >
          {t('admin.manageProducts')}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="group rounded-2xl border border-white/10 bg-[#121212] p-5 shadow-xl transition hover:-translate-y-0.5 hover:border-[#C9A84C]/40 hover:bg-[#171717]"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="rounded-2xl bg-[#C9A84C]/10 p-3 text-[#C9A84C]">
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-[#777] transition group-hover:text-[#C9A84C]" />
              </div>
              <div className="mt-5 text-3xl font-black text-white">
                {loading ? '—' : card.value}
              </div>
              <div className="mt-1 text-sm text-[#AFA79A]">{card.label}</div>
            </Link>
          );
        })}
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#101010] p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white">{t('admin.recentOrders')}</h2>
            <p className="mt-1 text-sm text-[#AFA79A]">{t('admin.ordersLabel')}</p>
          </div>
          <Link href="/orders" className="text-sm font-semibold text-[#C9A84C] hover:text-[#D9B95F]">
            {t('common.viewAll')}
          </Link>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-[#AFA79A]">
            {t('common.loading')}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-[#AFA79A]">
            {t('admin.noRecentOrders')}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-[#C9A84C]">
                  <tr>
                    <th className="px-4 py-3 text-start font-bold">#</th>
                    <th className="px-4 py-3 text-start font-bold">{t('admin.customer')}</th>
                    <th className="px-4 py-3 text-start font-bold">{t('admin.governorate')}</th>
                    <th className="px-4 py-3 text-start font-bold">{t('admin.total')}</th>
                    <th className="px-4 py-3 text-start font-bold">{t('admin.status')}</th>
                    <th className="px-4 py-3 text-start font-bold">{t('admin.date')}</th>
                    <th className="px-4 py-3 text-end font-bold">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {orders.map((order) => (
                    <tr key={order.id} className="text-[#EDE7DD] transition hover:bg-white/[0.03]">
                      <td className="px-4 py-3 font-semibold text-white">#{order.order_number}</td>
                      <td className="px-4 py-3">
                        {order.address_snapshot?.full_name ?? t('common.noData')}
                      </td>
                      <td className="px-4 py-3">
                        {order.address_snapshot?.governorate ?? t('common.noData')}
                      </td>
                      <td className="px-4 py-3">{formatSYP(Number(order.total_syp) || 0)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            'inline-flex rounded-full border px-3 py-1 text-xs font-bold',
                            STATUS_COLORS[order.status] ?? 'border-white/10 bg-white/5 text-white'
                          ].join(' ')}
                        >
                          {t(statusKey(order.status))}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {new Date(order.created_at).toLocaleDateString(numberLocale)}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <Link
                          href={`/orders/${order.id}`}
                          className="font-semibold text-[#C9A84C] hover:text-[#D9B95F]"
                        >
                          {t('admin.viewOrder')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}