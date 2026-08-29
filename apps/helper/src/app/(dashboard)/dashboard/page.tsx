'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { formatSYP } from '@eurostore/shared';
import { RefreshCw, Repeat2 } from 'lucide-react';

interface Order {
  id: string; order_number: string; status: string;
  total_syp: number; created_at: string;
  address_snapshot: { full_name: string; phone: string; governorate: string; address: string };
}

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-900/30 text-yellow-400',
  confirmed:  'bg-blue-900/30 text-blue-400',
  processing: 'bg-purple-900/30 text-purple-400',
  picked_up:  'bg-indigo-900/30 text-indigo-400',
  shipped:    'bg-teal-900/30 text-teal-400',
  delivered:  'bg-green-900/30 text-green-400',
  rejected:   'bg-red-900/30 text-red-400',
};

export default function HelperDashboardPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendingExchanges, setPendingExchanges] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');

  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ordersRes, exchangeRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/helper/exchanges/review'),
      ]);
      if (!ordersRes.ok || !exchangeRes.ok) throw new Error('request_failed');
      const ordersData = await ordersRes.json() as Order[];
      const exchangePayload = await exchangeRes.json() as { data?: { status: string }[] };
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setPendingExchanges(Array.isArray(exchangePayload.data) ? exchangePayload.data.filter(e => e.status === 'pending').length : 0);
    } catch {
      setError(t('helper.dashboardLoadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);
  useEffect(() => { void load(); }, [load]);

  const updateStatus = async (id: string, nextStatus: string) => {
    setUpdating(id);
    setError('');
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) throw new Error('request_failed');
      await load();
    } catch {
      setError(t('helper.orderUpdateError'));
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Summary Row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[#2E2E2E] bg-[#151515] p-5 shadow-sm">
          <p className="text-sm text-[#9CA3AF]">{t('helper.pendingOrders')}</p>
          <p className="mt-2 text-3xl font-black text-primary">{pendingOrdersCount}</p>
        </div>
        <div className="rounded-lg border border-[#2E2E2E] bg-[#151515] p-5 shadow-sm">
          <p className="text-sm text-[#9CA3AF]">{t('helper.pendingExchanges')}</p>
          <p className="mt-2 text-3xl font-black text-amber-500">{pendingExchanges}</p>
        </div>
      </div>

      {!loading && pendingExchanges > 0 && (
        <Link href="/exchange"
          className="flex items-center gap-4 rounded-lg border border-amber-700/40 bg-amber-900/20 px-5 py-4 transition-colors hover:border-amber-500">
          <Repeat2 className="h-6 w-6 shrink-0 text-amber-300" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-bold text-amber-300">
              {t('helper.pendingExchangeCount', { count: pendingExchanges })}
            </p>
            <p className="text-xs text-amber-400/70">{t('helper.reviewExchanges')}</p>
          </div>
          <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-black text-[#0F0F0F]">
            {pendingExchanges}
          </span>
        </Link>
      )}

      <div className="flex items-center justify-between">
        <h1 id="order-queue" className="text-2xl font-bold text-[#E2E2E2]">{t('helper.orderQueue')}</h1>
        <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded border border-[#2E2E2E] px-4 py-2 text-sm text-[#E2E2E2] hover:border-primary">
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> {t('common.refresh')}
        </button>
      </div>

      {error && <p className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">{error}</p>}

      {loading ? <p className="text-[#9CA3AF]">{t('common.loading')}</p> : orders.length === 0 ? (
        <div className="rounded-lg border border-[#2E2E2E] p-12 text-center text-[#9CA3AF]">
          {t('helper.noOrders')}
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map(o => (
            <div key={o.id} className="rounded-lg border border-[#2E2E2E] bg-[#151515] p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <span className="font-mono text-primary font-bold">#{o.order_number}</span>
                  <p className="text-[#E2E2E2] mt-1">{o.address_snapshot.full_name} - {o.address_snapshot.phone}</p>
                  <p className="text-sm text-[#9CA3AF]">{o.address_snapshot.governorate} - {o.address_snapshot.address}</p>
                  <p className="text-sm text-[#9CA3AF] mt-1">{formatSYP(Math.round(o.total_syp))}</p>
                  <p className="text-xs text-[#6B7280] mt-1">{new Date(o.created_at).toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US')}</p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <span className={`rounded px-2 py-1 text-xs font-medium ${STATUS_COLORS[o.status] ?? ''}`}>{t(`helper.orderStatuses.${o.status}`)}</span>
                  <select
                    aria-label={locale === 'ar' ? `حالة الطلب ${o.order_number}` : `Status for order ${o.order_number}`}
                    value={o.status}
                    onChange={(e) => { void updateStatus(o.id, e.target.value); }}
                    disabled={updating === o.id}
                    className="rounded border border-[#2E2E2E] bg-[#111111] px-3 py-2 text-sm text-[#E2E2E2] outline-none hover:border-primary focus:border-primary disabled:opacity-50"
                  >
                    {Object.keys(STATUS_COLORS).map((status) => (
                      <option key={status} value={status}>{t(`helper.orderStatuses.${status}`)}</option>
                    ))}
                  </select>
                  {updating === o.id && <span className="mr-2 text-xs text-primary">...</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
