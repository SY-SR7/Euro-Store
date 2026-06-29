'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Exchange {
  id: string; order_id?: string|null; customer_id?: string|null;
  reason: string; status: string; created_at: string; notes?: string|null;
}

const STATUS_AR: Record<string,string> = { pending:'معلق', approved:'موافق عليه', qr_generated:'QR مُنشأ', qr_scanned:'QR ممسوح', completed:'مكتمل', rejected:'مرفوض', expired:'منتهي' };
const STATUS_COLOR: Record<string,string> = { pending:'bg-yellow-50 text-yellow-700 border-yellow-200', approved:'bg-blue-50 text-blue-700 border-blue-200', qr_generated:'bg-purple-50 text-purple-700 border-purple-200', completed:'bg-green-50 text-green-700 border-green-200', rejected:'bg-red-50 text-red-700 border-red-200', expired:'bg-gray-100 text-gray-500 border-gray-200' };
const TRANSITIONS: Record<string,string[]> = { pending:['approved','rejected'], approved:['qr_generated','rejected'], qr_generated:['qr_scanned'], qr_scanned:['completed'], completed:[], rejected:[], expired:[] };

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

export default function AdminExchangesPage() {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('');
  const [selected, setSelected]   = useState<Exchange|null>(null);
  const [notes, setNotes]         = useState('');
  const [updating, setUpdating]   = useState(false);
  const [msg, setMsg]             = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (filter) p.set('status', filter);
    fetch(`/api/exchanges?${p}`, { cache: 'no-store' })
      .then(r => r.json()).then(d => setExchanges(Array.isArray(d) ? d : []))
      .catch(() => setExchanges([])).finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const openExchange = (e: Exchange) => { setSelected(e); setNotes(e.notes ?? ''); setMsg(''); };

  const changeStatus = async (ex: Exchange, newStatus: string) => {
    setUpdating(true); setMsg('');
    const res = await fetch(`/api/exchanges/${ex.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, notes }),
    });
    if (res.ok) {
      const updated = { ...ex, status: newStatus, notes };
      setSelected(updated); setExchanges(es => es.map(x => x.id === ex.id ? updated : x));
      setMsg(`✓ الحالة: ${STATUS_AR[newStatus] ?? newStatus}`);
    } else { setMsg('✗ فشل التحديث'); }
    setUpdating(false);
  };

  const saveNotes = async (ex: Exchange) => {
    setUpdating(true);
    const res = await fetch(`/api/exchanges/${ex.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes }) });
    if (res.ok) { setSelected({ ...ex, notes }); setMsg('✓ تم حفظ الملاحظات'); }
    else { setMsg('✗ فشل'); }
    setUpdating(false);
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <div><h1 className="text-2xl font-black text-[#1C1917]">طلبات الاستبدال</h1><p className="mt-1 text-sm text-[#A8A29E]">{exchanges.length} طلب</p></div>
        <button onClick={load} className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#57534E] hover:border-[#B8860B]">تحديث ↻</button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
        {[['', 'الكل'], ...Object.entries(STATUS_AR)].map(([k, v]) => (
          <button key={k} onClick={() => { setFilter(k); }}
            className={['rounded-lg px-3 py-1.5 text-xs font-bold border transition-colors', filter === k ? 'bg-[#B8860B] text-white border-[#B8860B]' : 'border-[#E5E0D8] text-[#57534E] hover:border-[#B8860B]'].join(' ')}>
            {v}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? <p className="p-10 text-center text-sm text-[#A8A29E]">جاري التحميل...</p>
        : exchanges.length === 0 ? <p className="p-10 text-center text-sm text-[#A8A29E]">لا توجد طلبات</p>
        : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]"><tr>
                {['السبب','الحالة','التاريخ'].map((h,i) => <th key={i} className="px-5 py-3 text-right text-xs font-black text-[#A8A29E]">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {exchanges.map(e => (
                  <tr key={e.id} className="hover:bg-[#FAFAF8] cursor-pointer transition-colors" onClick={() => openExchange(e)}>
                    <td className="px-5 py-3 text-[#1C1917] max-w-[250px] truncate">{e.reason}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${STATUS_COLOR[e.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>{STATUS_AR[e.status] ?? e.status}</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-[#A8A29E]">{new Date(e.created_at).toLocaleDateString('ar-SY')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <Modal title="طلب استبدال" onClose={() => setSelected(null)}>
          {msg && <div className={`mb-3 rounded-xl px-4 py-2 text-sm ${msg.startsWith('✓') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}
          <div className="space-y-3 text-sm">
            <div className="border-b border-[#F0ECE6] pb-2"><span className="block text-xs text-[#A8A29E] mb-1">السبب</span><p className="text-[#1C1917]">{selected.reason}</p></div>
            <div className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">التاريخ</span><span>{new Date(selected.created_at).toLocaleDateString('ar-SY')}</span></div>
            <div className="flex justify-between border-b border-[#F0ECE6] pb-2">
              <span className="text-[#A8A29E]">الحالة</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${STATUS_COLOR[selected.status] ?? ''}`}>{STATUS_AR[selected.status] ?? selected.status}</span>
            </div>
            <div className="border-b border-[#F0ECE6] pb-3">
              <label className="mb-1 block text-xs font-bold text-[#A8A29E]">ملاحظات الادمن</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]" />
              <button onClick={() => void saveNotes(selected)} disabled={updating} className="mt-2 rounded-xl border border-[#B8860B] px-4 py-1.5 text-xs font-bold text-[#B8860B] hover:bg-[#B8860B]/10">حفظ الملاحظات</button>
            </div>
            {(TRANSITIONS[selected.status] ?? []).length > 0 && (
              <div><p className="mb-2 text-xs font-bold text-[#A8A29E]">تغيير الحالة إلى:</p>
              <div className="flex flex-wrap gap-2">
                {(TRANSITIONS[selected.status] ?? []).map(s => (
                  <button key={s} onClick={() => void changeStatus(selected, s)} disabled={updating}
                    className={`rounded-xl px-4 py-2 text-sm font-bold text-white ${s==='rejected'?'bg-red-500 hover:bg-red-600':'bg-[#B8860B] hover:bg-[#9A7209]'} disabled:opacity-50`}>
                    → {STATUS_AR[s]}
                  </button>
                ))}
              </div></div>
            )}
            {selected.order_id && <Link href={`/orders/${selected.order_id}`} className="block font-bold text-[#B8860B] hover:underline text-sm pt-2">عرض الطلب المرتبط ←</Link>}
          </div>
        </Modal>
      )}
    </div>
  );
}