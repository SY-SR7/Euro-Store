/// <reference lib="dom" />
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { formatSYP } from '@eurostore/shared';

interface Order {
  id: string; order_number: string; status: string;
  total_syp: number; created_at: string;
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

export default function AdminOrdersPage() {
  const t = useTranslations();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (statusFilter) params.set('status', statusFilter);
    fetch(`/api/orders?${params.toString()}`)
      .then(r => r.json())
      .then((d: { data: Order[]; total: number }) => { setOrders(d.data ?? []); setTotal(d.total ?? 0); setLoading(false); })
      .catch(() => setLoading(false));
  }, [page, statusFilter]);

  const statuses = ['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#E2E2E2]">{t('admin.orders')} ({total})</h1>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter((e.target as HTMLInputElement).value); setPage(1); }}
          className="rounded border border-[#2E2E2E] bg-[#151515] px-3 py-2 text-sm text-[#E2E2E2] outline-none"
        >
          {statuses.map(s => <option key={s} value={s}>{s || t('admin.allStatuses')}</option>)}
        </select>
      </div>

      {loading ? <p className="text-[#9CA3AF]">{t('common.loading')}</p> : (
        <div className="overflow-x-auto rounded-lg border border-[#2E2E2E]">
          <table className="w-full text-sm text-[#E2E2E2]">
            <thead className="bg-[#1A1A1A] text-[#9CA3AF]">
              <tr>
                {['#', t('admin.customer'), t('admin.governorate'), t('admin.total'), t('admin.status'), t('admin.date'), ''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-start">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-t border-[#2E2E2E] hover:bg-[#1A1A1A]">
                  <td className="px-4 py-3 font-mono text-[#C9A84C]">{o.order_number}</td>
                  <td className="px-4 py-3">{o.address_snapshot.full_name}</td>
                  <td className="px-4 py-3 text-[#9CA3AF]">{o.address_snapshot.governorate}</td>
                  <td className="px-4 py-3">{formatSYP(Number(o.total_syp))}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-1 text-xs font-medium ${STATUS_COLORS[o.status] ?? ''}`}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3 text-[#9CA3AF] text-xs">{new Date(o.created_at).toLocaleDateString('ar-SY')}</td>
                  <td className="px-4 py-3">
                    <Link href={`/orders/${o.id}`} className="text-[#C9A84C] hover:underline text-xs">{t('admin.viewOrder')}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between items-center">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className="rounded border border-[#2E2E2E] px-4 py-2 text-sm text-[#E2E2E2] disabled:opacity-40">
          {t('common.prev')}
        </button>
        <span className="text-sm text-[#9CA3AF]">{t('common.page')} {page}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={orders.length < 20}
          className="rounded border border-[#2E2E2E] px-4 py-2 text-sm text-[#E2E2E2] disabled:opacity-40">
          {t('common.next')}
        </button>
      </div>
    </div>
  );
}
