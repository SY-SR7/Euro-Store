'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Order {
  id: string; order_number: string; status: string;
  total_syp: number; created_at: string;
  address_snapshot: { full_name?: string; governorate?: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-900/30 text-yellow-400 border-yellow-900',
  confirmed:  'bg-blue-900/30 text-blue-400 border-blue-900',
  processing: 'bg-purple-900/30 text-purple-400 border-purple-900',
  shipped:    'bg-indigo-900/30 text-indigo-400 border-indigo-900',
  delivered:  'bg-green-900/30 text-green-400 border-green-900',
  cancelled:  'bg-red-900/30 text-red-400 border-red-900',
};
const STATUS_AR: Record<string, string> = {
  pending:'معلق', confirmed:'مؤكد', processing:'قيد التجهيز',
  shipped:'تم الشحن', delivered:'تم التسليم', cancelled:'ملغي',
};

export default function AdminOrdersPage() {
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [status,   setStatus]   = useState('');
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    fetch(`/api/orders?${params}`)
      .then(r => r.json())
      .then(d => { setOrders(Array.isArray(d.orders) ? d.orders : []); setTotal(d.total ?? 0); })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);

  const statuses = ['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#101010] p-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">الطلبات</h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">{total} طلب إجمالاً</p>
        </div>
        <button onClick={load}
          className="rounded-2xl border border-white/10 px-4 py-2.5 text-sm text-[#9CA3AF] hover:border-[#C9A84C] hover:text-[#EDE7DD] transition-colors">
          تحديث ↻
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#101010] p-4 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="بحث برقم الطلب أو اسم العميل..."
          className="flex-1 rounded-xl border border-white/10 bg-[#151515] px-4 py-2.5 text-sm text-[#EDE7DD] outline-none focus:border-[#C9A84C] transition-colors"
        />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="rounded-xl border border-white/10 bg-[#151515] px-4 py-2.5 text-sm text-[#EDE7DD] outline-none focus:border-[#C9A84C] transition-colors">
          <option value="">كل الحالات</option>
          {statuses.slice(1).map(s => (
            <option key={s} value={s}>{STATUS_AR[s] ?? s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#101010]">
        {loading ? (
          <div className="p-10 text-center text-[#9CA3AF]">جاري التحميل...</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-[#9CA3AF]">لا توجد طلبات</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-[#C9A84C]">
                <tr>
                  <th className="px-4 py-4 text-right font-black">رقم الطلب</th>
                  <th className="px-4 py-4 text-right font-black">العميل</th>
                  <th className="px-4 py-4 text-right font-black hidden sm:table-cell">المحافظة</th>
                  <th className="px-4 py-4 text-right font-black">الحالة</th>
                  <th className="px-4 py-4 text-right font-black hidden md:table-cell">الإجمالي</th>
                  <th className="px-4 py-4 text-right font-black hidden md:table-cell">التاريخ</th>
                  <th className="px-4 py-4 text-left font-black">تفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {orders.map(o => (
                  <tr key={o.id} className="text-[#EDE7DD] hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-4 font-mono font-bold text-white">{o.order_number}</td>
                    <td className="px-4 py-4">{o.address_snapshot?.full_name ?? '—'}</td>
                    <td className="px-4 py-4 hidden sm:table-cell text-[#9CA3AF]">{o.address_snapshot?.governorate ?? '—'}</td>
                    <td className="px-4 py-4">
                      <span className={['rounded-full border px-3 py-1 text-xs font-black', STATUS_COLORS[o.status] ?? 'bg-white/5 text-[#9CA3AF] border-white/10'].join(' ')}>
                        {STATUS_AR[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell text-[#9CA3AF]">{Number(o.total_syp).toLocaleString('ar-SY')} ل.س</td>
                    <td className="px-4 py-4 hidden md:table-cell text-[#9CA3AF] text-xs">{new Date(o.created_at).toLocaleDateString('ar-SY')}</td>
                    <td className="px-4 py-4 text-left">
                      <Link href={`/orders/${o.id}`} className="font-black text-[#C9A84C] hover:text-[#D8B95F] transition-colors">
                        عرض
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-[#9CA3AF] hover:border-[#C9A84C] hover:text-[#EDE7DD] disabled:opacity-30 transition-colors">
            السابق
          </button>
          <span className="text-sm text-[#9CA3AF]">صفحة {page} / {Math.ceil(total / 20)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-[#9CA3AF] hover:border-[#C9A84C] hover:text-[#EDE7DD] disabled:opacity-30 transition-colors">
            التالي
          </button>
        </div>
      )}
    </div>
  );
}