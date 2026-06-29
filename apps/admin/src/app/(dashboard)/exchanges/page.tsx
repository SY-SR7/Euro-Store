'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface ExchangeRequest {
  id: string; order_id?: string | null; customer_id?: string | null;
  reason?: string | null; status?: string | null; created_at?: string | null;
}

const STATUS_BADGE: Record<string,string> = {
  pending:'badge-gold', approved:'badge-green', rejected:'badge-red', completed:'badge-blue',
};
const STATUS_LABELS: Record<string,string> = {
  pending:'معلق', approved:'مقبول', rejected:'مرفوض', completed:'مكتمل',
};

function pickArray<T>(p: unknown): T[] {
  if (Array.isArray(p)) return p as T[];
  if (p && typeof p === 'object') {
    const o = p as Record<string,unknown>;
    for (const k of ['data','items','exchanges','requests','exchange_requests']) {
      if (Array.isArray(o[k])) return o[k] as T[];
    }
  }
  return [];
}

export default function AdminExchangesPage() {
  const [exchanges, setExchanges] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('');
  const [error, setError]         = useState('');

  async function fetchExchanges(status?: string) {
    setLoading(true); setError('');
    try {
      const url = status ? `/api/exchanges?status=${encodeURIComponent(status)}` : '/api/exchanges';
      const res = await fetch(url, { cache: 'no-store' });
      const payload = await res.json().catch(() => null);
      if (!res.ok) { setError((payload as {error?:string}|null)?.error ?? 'خطأ'); setExchanges([]); }
      else setExchanges(pickArray<ExchangeRequest>(payload));
    } catch { setError('تعذر الاتصال بالخادم'); setExchanges([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { void fetchExchanges(filter || undefined); }, [filter]);

  const filters = [{ v:'', l:'الكل' },{ v:'pending', l:'معلق' },{ v:'approved', l:'مقبول' },{ v:'rejected', l:'مرفوض' },{ v:'completed', l:'مكتمل' }];

  return (
    <div className="space-y-5" dir="rtl">
      <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-black text-[#1C1917]">طلبات الاستبدال</h1>
        <p className="mt-1 text-sm text-[#A8A29E]">{exchanges.length} طلب</p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
        {filters.map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={['rounded-lg px-4 py-2 text-xs font-black border transition-colors', filter===f.v ? 'bg-[#B8860B] text-[#1F1B16] border-[#B8860B]' : 'border-[#E5E0D8] text-[#57534E] hover:border-[#B8860B]'].join(' ')}>
            {f.l}
          </button>
        ))}
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? <p className="p-10 text-center text-sm text-[#A8A29E]">جاري التحميل...</p>
        : exchanges.length === 0 ? <p className="p-10 text-center text-sm text-[#A8A29E]">لا توجد طلبات</p>
        : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]">
                <tr>
                  {['رقم الطلب','العميل','السبب','الحالة','التاريخ','تفاصيل'].map((h,i) => (
                    <th key={i} className={`px-5 py-3 text-right text-xs font-black text-[#A8A29E] ${i===1||i===2?'hidden sm:table-cell':''} ${i===5?'text-left':''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {exchanges.map(ex => (
                  <tr key={ex.id} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-bold text-[#1C1917]">{ex.order_id?.slice(-8) ?? '—'}</td>
                    <td className="px-5 py-3 text-xs text-[#57534E] hidden sm:table-cell">{ex.customer_id?.slice(-8) ?? '—'}</td>
                    <td className="px-5 py-3 max-w-[180px] truncate text-[#57534E] hidden sm:table-cell">{ex.reason ?? '—'}</td>
                    <td className="px-5 py-3"><span className={STATUS_BADGE[ex.status??''] ?? 'badge-gray'}>{STATUS_LABELS[ex.status??''] ?? ex.status}</span></td>
                    <td className="px-5 py-3 text-xs text-[#A8A29E]">{ex.created_at ? new Date(ex.created_at).toLocaleDateString('ar-SY') : '—'}</td>
                    <td className="px-5 py-3 text-left"><Link href={`/exchanges/${ex.id}`} className="font-bold text-[#B8860B] hover:underline">تفاصيل</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}