'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface ExchangeRequest {
  id         : string;
  order_id   : string;
  customer_id: string;
  reason     : string;
  status     : string;
  created_at : string;
}

const STATUS_COLORS: Record<string, string> = {
  pending  : 'text-yellow-400',
  approved : 'text-green-400',
  rejected : 'text-red-400',
  completed: 'text-blue-400',
};

export default function AdminExchangesPage() {
  const t = useTranslations();
  const [exchanges, setExchanges] = useState<ExchangeRequest[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('');

  async function fetchExchanges(status?: string) {
    setLoading(true);
    const url = status ? `/api/exchanges?status=${status}` : '/api/exchanges';
    const res = await fetch(url);
    const d   = await res.json() as ExchangeRequest[];
    setExchanges(d);
    setLoading(false);
  }

  useEffect(() => { void fetchExchanges(filter || undefined); }, [filter]);

  async function handleStatus(id: string, status: string) {
    await fetch(`/api/exchanges/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    void fetchExchanges(filter || undefined);
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-[#E2E2E2] mb-6">{t('admin.exchanges')}</h1>

      {/* Filter */}
      <div className="mb-6 flex gap-2">
        {['', 'pending', 'approved', 'rejected', 'completed'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-md px-4 py-1.5 text-sm transition-colors ${filter === s ? 'bg-[#C9A84C] text-[#0F0F0F]' : 'border border-[#2E2E2E] text-[#9CA3AF] hover:border-[#C9A84C]'}`}
          >
            {s ? t(`admin.exchangeStatus.${s}`) : t('common.all')}
          </button>
        ))}
      </div>

      {loading ? <p className="text-[#9CA3AF]">{t('common.loading')}</p> : (
        <div className="overflow-hidden rounded-md border border-[#2E2E2E]">
          <table className="w-full text-sm">
            <thead className="bg-[#1A1A1A] text-[#9CA3AF] text-xs">
              <tr>
                <th className="px-4 py-3 text-start">ID</th>
                <th className="px-4 py-3 text-start">{t('exchange.reason')}</th>
                <th className="px-4 py-3 text-start">{t('common.status')}</th>
                <th className="px-4 py-3 text-start">{t('common.date')}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E2E]">
              {exchanges.map((ex) => (
                <tr key={ex.id}>
                  <td className="px-4 py-3 font-mono text-xs text-[#9CA3AF]">{ex.id.slice(0, 8)}¦</td>
                  <td className="px-4 py-3 text-[#D6D3C7] max-w-xs truncate">{ex.reason}</td>
                  <td className={`px-4 py-3 font-semibold ${STATUS_COLORS[ex.status] ?? 'text-[#E2E2E2]'}`}>{ex.status}</td>
                  <td className="px-4 py-3 text-[#9CA3AF] text-xs">{new Date(ex.created_at).toLocaleDateString('ar-SY')}</td>
                  <td className="px-4 py-3 flex gap-3 items-center">
                    <Link href={`/exchanges/${ex.id}`} className="text-xs text-[#C9A84C] hover:underline">ØªÙØ§ØµÙŠÙ„</Link>
                    {ex.status === 'pending' && (
                      <>
                        <button onClick={() => handleStatus(ex.id, 'approved')} className="text-xs text-green-400 hover:underline">{t('admin.approve')}</button>
                        <button onClick={() => handleStatus(ex.id, 'rejected')} className="text-xs text-red-400 hover:underline">{t('admin.reject')}</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
