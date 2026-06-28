'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface Stats {
  total_orders     : number;
  total_revenue_syp: number;
  total_customers  : number;
  pending_exchanges: number;
}

export default function AdminDashboardPage() {
  const t = useTranslations();
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then((d: Stats) => setStats(d))
      .finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: t('admin.totalOrders'),     value: stats.total_orders.toLocaleString('ar-SY'),                         color: 'text-[#C9A84C]' },
    { label: t('admin.totalRevenue'),    value: `${stats.total_revenue_syp.toLocaleString('ar-SY')} ل.س`,           color: 'text-green-400' },
    { label: t('admin.totalCustomers'),  value: stats.total_customers.toLocaleString('ar-SY'),                      color: 'text-blue-400'  },
    { label: t('admin.pendingExchanges'),value: stats.pending_exchanges.toLocaleString('ar-SY'),                    color: 'text-orange-400'},
  ] : [];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-[#E2E2E2] mb-8">{t('admin.dashboard')}</h1>
      {loading ? (
        <p className="text-[#9CA3AF]">{t('common.loading')}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-lg border border-[#2E2E2E] bg-[#151515] p-6">
              <p className="text-sm text-[#9CA3AF]">{card.label}</p>
              <p className={`mt-2 text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}