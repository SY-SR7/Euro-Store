'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Order {
  id: string; order_number: string; status: string;
  total_syp: number; created_at: string;
  address_snapshot: { full_name?: string; governorate?: string } | null;
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-gold', confirmed: 'badge-blue', processing: 'badge-purple',
  shipped: 'badge-blue', delivered: 'badge-green', cancelled: 'badge-red',
};
const STATUS_AR: Record<string, string> = {
  pending:'معلق', confirmed:'مؤكد', processing:'قيد التجهيز',
  shipped:'تم الشحن', delivered:'تم التسليم', cancelled:'ملغي',
};

export default function AdminOrdersPage() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [status, setStatus]   = useState('');
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: '20' });
    if (status) p.set('status', status);
    if (search) p.set('search', search);
    fetch(`/api/orders?${p}`)
      .then(r => r.json())
      .then(d => { setOrders(Array.isArray(d.orders) ? d.orders : []); setTotal(d.total ?? 0); })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1C1917]">الطلبات</h1>
          <p className="mt-1 text-sm text-[#A8A29E]">{total} طلب إجمالاً</p>
        </div>
        <button onClick={load} className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#57534E] hover:border-[#B8860B] hover:text-[#B8860B] transition-colors">
          تحديث ↻
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="بحث برقم الطلب أو اسم العميل..." className="input-field flex-1" />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input-field sm:w-44">
          <option value="">كل الحالات</option>
          {Object.entries(STATUS_AR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? (
          <p className="p-10 text-center text-sm text-[#A8A29E]">جاري التحميل...</p>
        ) : orders.length === 0 ? (
          <p className="p-10 text-center text-sm text-[#A8A29E]">لا توجد طلبات</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]">
                <tr>
                  {['رقم الطلب','العميل','المحافظة','الحالة','الإجمالي','التاريخ','تفاصيل'].map((h, i) => (
                    <th key={i} className={`px-5 py-3 text-right text-xs font-black text-[#A8A29E] ${i===2?'hidden sm:table-cell':''} ${i===4||i===5?'hidden md:table-cell':''} ${i===6?'text-left':''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-bold text-[#1C1917]">{o.order_number}</td>
                    <td className="px-5 py-3 text-[#57534E]">{o.address_snapshot?.full_name ?? '—'}</td>
                    <td className="px-5 py-3 hidden sm:table-cell text-[#A8A29E]">{o.address_snapshot?.governorate ?? '—'}</td>
                    <td className="px-5 py-3"><span className={STATUS_BADGE[o.status] ?? 'badge-gray'}>{STATUS_AR[o.status] ?? o.status}</span></td>
                    <td className="px-5 py-3 hidden md:table-cell text-[#57534E]">{Number(o.total_syp).toLocaleString('ar-SY')} ل.س</td>
                    <td className="px-5 py-3 hidden md:table-cell text-xs text-[#A8A29E]">{new Date(o.created_at).toLocaleDateString('ar-SY')}</td>
                    <td className="px-5 py-3 text-left"><Link href={`/orders/${o.id}`} className="font-bold text-[#B8860B] hover:underline">عرض</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {total > 20 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#57534E] hover:border-[#B8860B] disabled:opacity-40 transition-colors">السابق</button>
          <span className="text-sm text-[#A8A29E]">صفحة {page} / {Math.ceil(total/20)}</span>
          <button onClick={() => setPage(p=>p+1)} disabled={page>=Math.ceil(total/20)} className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#57534E] hover:border-[#B8860B] disabled:opacity-40 transition-colors">التالي</button>
        </div>
      )}
    </div>
  );
}