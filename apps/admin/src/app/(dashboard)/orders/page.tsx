'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Order {
  id: string; order_number: string; status: string;
  total_syp: number; created_at: string;
  address_snapshot: { full_name?: string; governorate?: string; phone?: string } | null;
}

const STATUS_AR: Record<string, string> = {
  pending:'معلق', confirmed:'مؤكد', processing:'قيد التجهيز',
  shipped:'تم الشحن', delivered:'تم التسليم', cancelled:'ملغي',
};
const TRANSITIONS: Record<string, string[]> = {
  pending:['confirmed','cancelled'], confirmed:['processing','cancelled'],
  processing:['shipped','cancelled'], shipped:['delivered'], delivered:[], cancelled:[],
};
const STATUS_COLOR: Record<string,string> = {
  pending:'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed:'bg-blue-50 text-blue-700 border-blue-200',
  processing:'bg-purple-50 text-purple-700 border-purple-200',
  shipped:'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered:'bg-green-50 text-green-700 border-green-200',
  cancelled:'bg-red-50 text-red-700 border-red-200',
};

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl border border-[#E5E0D8] bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] px-6 py-4">
          <h2 className="font-black text-[#1C1917]">{title}</h2>
          <button onClick={onClose} className="text-xl text-[#A8A29E] hover:text-[#1C1917]">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order|null>(null);
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg]         = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: '25' });
    if (statusFilter) p.set('status', statusFilter);
    if (search) p.set('search', search);
    fetch(`/api/orders?${p}`)
      .then(r => r.json())
      .then(d => { setOrders(Array.isArray(d.orders) ? d.orders : []); setTotal(d.total ?? 0); })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [page, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const openOrder = (o: Order) => { setSelected(o); setMsg(''); };

  const changeStatus = async (o: Order, newStatus: string) => {
    setUpdating(true); setMsg('');
    const res = await fetch(`/api/orders/${o.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = { ...o, status: newStatus };
      setSelected(updated); setOrders(os => os.map(x => x.id === o.id ? updated : x));
      setMsg(`✓ تم التحديث إلى: ${STATUS_AR[newStatus] ?? newStatus}`);
    } else { setMsg('✗ فشل التحديث'); }
    setUpdating(false);
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <div><h1 className="text-2xl font-black text-[#1C1917]">الطلبات</h1><p className="mt-1 text-sm text-[#A8A29E]">{total} طلب إجمالاً</p></div>
        <button onClick={load} className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#57534E] hover:border-[#B8860B]">تحديث ↻</button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="بحث برقم الطلب أو اسم العميل..." className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B] flex-1" />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B] sm:w-44">
          <option value="">كل الحالات</option>
          {Object.entries(STATUS_AR).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? <p className="p-10 text-center text-sm text-[#A8A29E]">جاري التحميل...</p>
        : orders.length === 0 ? <p className="p-10 text-center text-sm text-[#A8A29E]">لا توجد طلبات</p>
        : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]"><tr>
                {['رقم الطلب','العميل','الحالة','الإجمالي','التاريخ'].map((h,i) => (
                  <th key={i} className={`px-5 py-3 text-right text-xs font-black text-[#A8A29E] ${i>=3?'hidden md:table-cell':''}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-[#FAFAF8] cursor-pointer transition-colors" onClick={() => openOrder(o)}>
                    <td className="px-5 py-3 font-mono text-xs font-bold text-[#1C1917]">{o.order_number}</td>
                    <td className="px-5 py-3 text-[#57534E]">{o.address_snapshot?.full_name ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${STATUS_COLOR[o.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>{STATUS_AR[o.status] ?? o.status}</span>
                    </td>
                    <td className="px-5 py-3 font-bold text-[#B8860B] hidden md:table-cell">{Number(o.total_syp).toLocaleString('ar-SY')} ل.س</td>
                    <td className="px-5 py-3 text-xs text-[#A8A29E] hidden md:table-cell">{new Date(o.created_at).toLocaleDateString('ar-SY')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {total > 25 && (
              <div className="flex items-center justify-between border-t border-[#F0ECE6] px-5 py-3">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="rounded-lg border border-[#E5E0D8] px-3 py-1.5 text-xs font-bold disabled:opacity-40">السابق</button>
                <span className="text-xs text-[#A8A29E]">صفحة {page} من {Math.ceil(total/25)}</span>
                <button onClick={() => setPage(p => p+1)} disabled={page*25>=total} className="rounded-lg border border-[#E5E0D8] px-3 py-1.5 text-xs font-bold disabled:opacity-40">التالي</button>
              </div>
            )}
          </div>
        )}
      </div>

      {selected && (
        <Modal title={`طلب #${selected.order_number}`} onClose={() => setSelected(null)}>
          {msg && <div className={`mb-3 rounded-xl px-4 py-2 text-sm ${msg.startsWith('✓') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}
          <div className="space-y-3 text-sm">
            {[['العميل', selected.address_snapshot?.full_name],['الهاتف', selected.address_snapshot?.phone],['المحافظة', selected.address_snapshot?.governorate],['الإجمالي', `${Number(selected.total_syp).toLocaleString('ar-SY')} ل.س`],['التاريخ', new Date(selected.created_at).toLocaleDateString('ar-SY')]].map(([l,v]) => (
              <div key={l} className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">{l}</span><span className="font-semibold text-[#1C1917]">{v ?? '—'}</span></div>
            ))}
            <div className="flex justify-between border-b border-[#F0ECE6] pb-2">
              <span className="text-[#A8A29E]">الحالة الحالية</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${STATUS_COLOR[selected.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>{STATUS_AR[selected.status] ?? selected.status}</span>
            </div>
            {(TRANSITIONS[selected.status] ?? []).length > 0 && (
              <div className="pt-2">
                <p className="mb-2 text-xs font-bold text-[#A8A29E]">تغيير الحالة إلى:</p>
                <div className="flex flex-wrap gap-2">
                  {(TRANSITIONS[selected.status] ?? []).map(s => (
                    <button key={s} onClick={() => void changeStatus(selected, s)} disabled={updating}
                      className="rounded-xl bg-[#B8860B] px-4 py-2 text-sm font-bold text-white hover:bg-[#9A7209] disabled:opacity-50">
                      → {STATUS_AR[s]}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-2">
              <Link href={`/orders/${selected.id}`} className="font-bold text-[#B8860B] hover:underline text-sm">عرض التفاصيل الكاملة ←</Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}