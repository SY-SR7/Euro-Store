'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { formatSYP } from '@eurostore/shared';

interface Stats {
  total_orders:      number;
  total_revenue_syp: number;
  total_customers:   number;
  pending_exchanges: number;
}

interface RecentOrder {
  id:               string;
  order_number:     string;
  status:           string;
  total_syp:        number;
  created_at:       string;
  address_snapshot: { full_name: string; governorate: string };
}

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-900/30 text-yellow-400',
  confirmed:  'bg-blue-900/30 text-blue-400',
  processing: 'bg-purple-900/30 text-purple-400',
  shipped:    'bg-indigo-900/30 text-indigo-400',
  delivered:  'bg-green-900/30 text-green-400',
  cancelled:  'bg-red-900/30 text-red-400',
};

export default function AdminDashboardPage() {
  const t = useTranslations();
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [orders,  setOrders]  = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([
      fetch('/api/dashboard/stats').then(r => r.json()),
      fetch('/api/orders?page=1&limit=8').then(r => r.json()),
    ]).then(([statsData, ordersData]: [Stats, { data: RecentOrder[] }]) => {
      setStats(statsData);
      setOrders(ordersData.data ?? []);
      setLoading(false);
    });
  }, []);

  const statCards = stats ? [
    { label: t('admin.totalOrders'),     value: stats.total_orders.toLocaleString('ar-SY'),                  color: 'text-[#C9A84C]',   href: '/orders'    },
    { label: t('admin.totalRevenue'),    value: `${stats.total_revenue_syp.toLocaleString('ar-SY')} Ù„.Ø³`,   color: 'text-green-400',   href: '/orders'    },
    { label: t('admin.totalCustomers'),  value: stats.total_customers.toLocaleString('ar-SY'),               color: 'text-blue-400',    href: '/customers' },
    { label: t('admin.pendingExchanges'),value: stats.pending_exchanges.toLocaleString('ar-SY'),             color: 'text-orange-400',  href: '/exchanges' },
  ] : [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#E2E2E2]">{t('admin.dashboard')}</h1>

      {loading ? (
        <p className="text-[#9CA3AF]">{t('common.loading')}</p>
      ) : (
        <>
          {/* â”€â”€ Stat Cards â”€â”€ */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statCards.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="group rounded-lg border border-[#2E2E2E] bg-[#151515] p-6 hover:border-[#C9A84C] transition-colors"
              >
                <p className="text-sm text-[#9CA3AF] group-hover:text-[#E2E2E2]">{card.label}</p>
                <p className={`mt-2 text-2xl font-bold ${card.color}`}>{card.value}</p>
              </Link>
            ))}
          </div>

          {/* â”€â”€ Recent Orders â”€â”€ */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#E2E2E2]">Ø¢Ø®Ø± Ø§Ù„Ø·Ù„Ø¨Ø§Øª</h2>
              <Link href="/orders" className="text-sm text-[#C9A84C] hover:underline">{t('common.viewAll')}</Link>
            </div>
            {orders.length === 0 ? (
              <p className="text-[#9CA3AF] text-sm">{t('common.noData')}</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[#2E2E2E]">
                <table className="w-full text-sm text-[#E2E2E2]">
                  <thead className="bg-[#1A1A1A] text-[#9CA3AF]">
                    <tr>
                      <th className="px-4 py-3 text-start">#</th>
                      <th className="px-4 py-3 text-start">Ø§Ù„Ø¹Ù…ÙŠÙ„</th>
                      <th className="px-4 py-3 text-start">Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø©</th>
                      <th className="px-4 py-3 text-start">Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ</th>
                      <th className="px-4 py-3 text-start">Ø§Ù„Ø­Ø§Ù„Ø©</th>
                      <th className="px-4 py-3 text-start">Ø§Ù„ØªØ§Ø±ÙŠØ®</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2E2E2E]">
                    {orders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-[#161616] transition-colors">
                        <td className="px-4 py-3 font-mono text-[#C9A84C] text-xs">#{order.order_number}</td>
                        <td className="px-4 py-3">{order.address_snapshot?.full_name ?? '”'}</td>
                        <td className="px-4 py-3 text-[#9CA3AF]">{order.address_snapshot?.governorate ?? '”'}</td>
                        <td className="px-4 py-3 font-semibold">{formatSYP(order.total_syp)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? 'text-[#9CA3AF]'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#6B7280]">
                          {new Date(order.created_at).toLocaleDateString('ar-SY')}
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/orders/${order.id}`} className="text-xs text-[#C9A84C] hover:underline">
                            ØªÙØ§ØµÙŠÙ„
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
