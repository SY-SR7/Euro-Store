'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface ExchangeRequest {
  id: string;
  order_id?: string | null;
  customer_id?: string | null;
  reason?: string | null;
  status?: string | null;
  created_at?: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'border-yellow-400/20 bg-yellow-400/10 text-yellow-200',
  approved: 'border-green-400/20 bg-green-400/10 text-green-200',
  rejected: 'border-red-400/20 bg-red-400/10 text-red-200',
  completed: 'border-blue-400/20 bg-blue-400/10 text-blue-200'
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'معلق',
  approved: 'مقبول',
  rejected: 'مرفوض',
  completed: 'مكتمل'
};

function pickArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];

  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;

    for (const key of ['data', 'items', 'exchanges', 'requests', 'exchange_requests']) {
      const candidate = obj[key];
      if (Array.isArray(candidate)) return candidate as T[];

      if (candidate && typeof candidate === 'object') {
        const nested = candidate as Record<string, unknown>;
        for (const nestedKey of ['data', 'items', 'exchanges', 'requests']) {
          if (Array.isArray(nested[nestedKey])) return nested[nestedKey] as T[];
        }
      }
    }
  }

  return [];
}

export default function AdminExchangesPage() {
  const [exchanges, setExchanges] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');

  async function fetchExchanges(status?: string) {
    setLoading(true);
    setError('');

    try {
      const url = status ? `/api/exchanges?status=${encodeURIComponent(status)}` : '/api/exchanges';
      const res = await fetch(url, { cache: 'no-store' });
      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        setError((payload as { error?: string } | null)?.error ?? 'تعذر تحميل طلبات الاستبدال');
        setExchanges([]);
      } else {
        setExchanges(pickArray<ExchangeRequest>(payload));
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
      setExchanges([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchExchanges(filter || undefined);
  }, [filter]);

  async function handleStatus(id: string, status: string) {
    await fetch(`/api/exchanges/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    void fetchExchanges(filter || undefined);
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-[#101010] p-6 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-black text-white">طلبات الاستبدال</h1>
          <p className="mt-2 text-sm text-[#9CA3AF]">
            مراجعة طلبات الاستبدال وتحديث حالتها.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { value: '', label: 'الكل' },
            { value: 'pending', label: 'معلق' },
            { value: 'approved', label: 'مقبول' },
            { value: 'rejected', label: 'مرفوض' },
            { value: 'completed', label: 'مكتمل' }
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={[
                'rounded-full px-4 py-2 text-xs font-bold transition',
                filter === item.value
                  ? 'bg-[#C9A84C] text-[#111111]'
                  : 'border border-white/10 text-[#B8B1A4] hover:border-[#C9A84C]/50'
              ].join(' ')}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#101010] shadow-2xl">
        {loading ? (
          <div className="p-10 text-center text-[#9CA3AF]">جار التحميل...</div>
        ) : exchanges.length === 0 ? (
          <div className="p-10 text-center text-[#9CA3AF]">لا توجد طلبات استبدال.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-[#C9A84C]">
                <tr>
                  <th className="px-4 py-4 text-right font-black">ID</th>
                  <th className="px-4 py-4 text-right font-black">السبب</th>
                  <th className="px-4 py-4 text-right font-black">الحالة</th>
                  <th className="px-4 py-4 text-right font-black">التاريخ</th>
                  <th className="px-4 py-4 text-left font-black">الإجراء</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {exchanges.map((ex) => {
                  const status = (ex.status ?? 'pending').toLowerCase();

                  return (
                    <tr key={ex.id} className="text-[#EDE7DD] hover:bg-white/[0.03]">
                      <td className="px-4 py-4 font-mono text-xs text-[#9CA3AF]">
                        {ex.id.slice(0, 8)}
                      </td>
                      <td className="max-w-xl truncate px-4 py-4">
                        {ex.reason ?? '—'}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={[
                            'inline-flex rounded-full border px-3 py-1 text-xs font-black',
                            STATUS_COLORS[status] ?? 'border-white/10 bg-white/5 text-white'
                          ].join(' ')}
                        >
                          {STATUS_LABELS[status] ?? ex.status ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {ex.created_at ? new Date(ex.created_at).toLocaleDateString('ar-SY') : '—'}
                      </td>
                      <td className="px-4 py-4 text-left">
                        <div className="flex justify-end gap-3">
                          {ex.order_id ? (
                            <Link
                              href={`/orders/${ex.order_id}`}
                              className="text-xs font-bold text-[#C9A84C] hover:text-[#D8B95F]"
                            >
                              تفاصيل الطلب
                            </Link>
                          ) : null}

                          {status === 'pending' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStatus(ex.id, 'approved')}
                                className="text-xs font-bold text-green-300 hover:text-green-200"
                              >
                                موافقة
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatus(ex.id, 'rejected')}
                                className="text-xs font-bold text-red-300 hover:text-red-200"
                              >
                                رفض
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}