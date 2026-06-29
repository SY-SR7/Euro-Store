'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { formatSYP } from '@eurostore/shared';

interface Order {
  id: string; order_number: string; status: string;
  total_syp: number; created_at: string;
  address_snapshot: { full_name: string; phone: string; governorate: string; address: string };
}

const STATUS_COLORS: Record<string, string> = {
  confirmed:  'bg-blue-900/30 text-blue-400',
  processing: 'bg-purple-900/30 text-purple-400',
};

export default function HelperDashboardPage() {
  const t = useTranslations();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/orders');
    const data = await res.json() as Order[];
    setOrders(Array.isArray(data) ? data : []);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const advance = async (id: string, currentStatus: string) => {
    const next = currentStatus === 'confirmed' ? 'processing' : 'shipped';
    setUpdating(id);
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    await load();
    setUpdating(null);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#E2E2E2]">{t('helper.orderQueue')}</h1>
        <button onClick={() => void load()} className="rounded border border-[#2E2E2E] px-4 py-2 text-sm text-[#E2E2E2] hover:border-[#C9A84C]">
          â†» {t('common.refresh')}
        </button>
      </div>

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
                  <p className="font-mono text-[#C9A84C] font-bold">#{o.order_number}</p>
                  <p className="text-[#E2E2E2] mt-1">{o.address_snapshot.full_name} â€” {o.address_snapshot.phone}</p>
                  <p className="text-sm text-[#9CA3AF]">{o.address_snapshot.governorate} â€” {o.address_snapshot.address}</p>
                  <p className="text-sm text-[#9CA3AF] mt-1">{formatSYP(Math.round(o.total_syp))}</p>
                  <p className="text-xs text-[#6B7280] mt-1">{new Date(o.created_at).toLocaleString('ar-SY')}</p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <span className={`rounded px-2 py-1 text-xs font-medium ${STATUS_COLORS[o.status] ?? ''}`}>{o.status}</span>
                  {o.status !== 'shipped' && (
                    <button
                      onClick={() => void advance(o.id, o.status)}
                      disabled={updating === o.id}
                      className="rounded bg-[#C9A84C] px-4 py-2 text-sm font-medium text-[#111] hover:bg-[#b8943e] disabled:opacity-50"
                    >
                      {updating === o.id ? '...' : o.status === 'confirmed' ? t('helper.markProcessing') : t('helper.markShipped')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
