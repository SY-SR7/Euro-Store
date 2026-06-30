'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface ExchangeRequest {
  id: string; order_id: string|null; customer_id: string|null;
  status: 'pending'|'approved'|'rejected'|'completed'|string;
  reason_ar: string|null; reason_en: string|null; notes: string|null;
  created_at: string;
}

const STATUS_AR: Record<string,string> = {
  pending: 'قيد الانتظار', approved: 'تمت الموافقة',
  rejected: 'مرفوض', completed: 'مكتمل',
};
const STATUS_COLOR: Record<string,string> = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  approved:  'bg-blue-50 text-blue-700 border-blue-200',
  rejected:  'bg-red-50 text-red-700 border-red-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
};
const NEXT_STATUS: Record<string,string> = { pending: 'approved', approved: 'completed' };

function Modal({ title, onClose, children }: { title:string; onClose:()=>void; children:React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl border border-[#E5E0D8] bg-white shadow-2xl max-h-[90vh] flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] px-6 py-4">
          <h2 className="font-black text-[#1C1917]">{title}</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F8F6F2] text-[#A8A29E] hover:bg-[#E5E0D8] text-lg">×</button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AdminExchangesPage() {
  const [requests,setRequests] = useState<ExchangeRequest[]>([]);
  const [loading,setLoading]   = useState(true);
  const [statusFilter,setStatusFilter] = useState<'all'|'pending'|'approved'|'rejected'|'completed'>('all');
  const [selected,setSelected] = useState<ExchangeRequest|null>(null);
  const [saving,setSaving]     = useState(false);
  const [msg,setMsg]           = useState('');

  const load = useCallback(()=>{
    setLoading(true);
    const p = new URLSearchParams();
    if (statusFilter !== 'all') p.set('status', statusFilter);
    fetch(`/api/exchanges?${p}`,{cache:'no-store'})
      .then(r=>r.json()).then(d=>setRequests(Array.isArray(d)?d:[]))
      .catch(()=>setRequests([])).finally(()=>setLoading(false));
  },[statusFilter]);

  useEffect(()=>{ load(); },[load]);

  const open = (r:ExchangeRequest) => { setSelected(r); setMsg(''); };

  const setStatus = async (r:ExchangeRequest, status:string) => {
    setSaving(true); setMsg('');
    const res = await fetch(`/api/exchanges/${r.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});
    if (res.ok) {
      const u = {...r, status};
      setRequests(rs=>rs.map(x=>x.id===r.id?u:x));
      if (selected?.id===r.id) setSelected(u);
      setMsg('✓ تم تحديث الحالة');
    } else { setMsg('✗ فشل التحديث'); }
    setSaving(false);
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-black text-[#1C1917]">طلبات الاستبدال</h1><p className="mt-1 text-sm text-[#A8A29E]">{requests.length} طلب</p></div>
        <div className="flex flex-wrap gap-1.5">
          {(['all','pending','approved','rejected','completed'] as const).map(s=>(
            <button key={s} onClick={()=>setStatusFilter(s)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${statusFilter===s?'border-[#B8860B] bg-[#B8860B] text-white':'border-[#E5E0D8] text-[#57534E] hover:border-[#B8860B]'}`}>
              {s==='all'?'الكل':STATUS_AR[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading?<p className="p-10 text-center text-sm text-[#A8A29E]">جارٍ التحميل...</p>
        :requests.length===0?<p className="p-10 text-center text-sm text-[#A8A29E]">لا توجد طلبات استبدال</p>
        :(
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]"><tr>
                {['الرقم','السبب','الحالة','تاريخ الطلب'].map((h,i)=>(
                  <th key={i} className={`px-5 py-3 text-right text-xs font-black text-[#A8A29E] ${i===3?'hidden md:table-cell':''}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {requests.map(r=>(
                  <tr key={r.id} className="group hover:bg-[#FFFBF0] cursor-pointer transition-colors" onClick={()=>open(r)}>
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-[#1C1917] group-hover:text-[#B8860B]">{r.id.slice(0,8)}…</td>
                    <td className="px-5 py-3 text-[#57534E] max-w-xs truncate">{r.reason_ar??r.reason_en??'—'}</td>
                    <td className="px-5 py-3"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${STATUS_COLOR[r.status]??'bg-gray-50 text-gray-600 border-gray-200'}`}>{STATUS_AR[r.status]??r.status}</span></td>
                    <td className="px-5 py-3 text-xs text-[#A8A29E] hidden md:table-cell">{new Date(r.created_at).toLocaleDateString('ar-SY')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected&&(
        <Modal title={`طلب استبدال #${selected.id.slice(0,8)}`} onClose={()=>setSelected(null)}>
          {msg&&<div className={`mb-4 rounded-xl px-4 py-2 text-sm ${msg.startsWith('✓')?'bg-green-50 text-green-700 border border-green-200':'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">الحالة</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${STATUS_COLOR[selected.status]??''}`}>{STATUS_AR[selected.status]??selected.status}</span>
            </div>
            <div className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">السبب (عربي)</span><span className="font-semibold text-[#1C1917]">{selected.reason_ar??'—'}</span></div>
            <div className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">السبب (إنجليزي)</span><span className="font-semibold text-[#1C1917]" dir="ltr">{selected.reason_en??'—'}</span></div>
            <div className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">تاريخ الطلب</span><span className="font-semibold text-[#1C1917]">{new Date(selected.created_at).toLocaleDateString('ar-SY')}</span></div>

            {NEXT_STATUS[selected.status] && (
              <button onClick={()=>void setStatus(selected, NEXT_STATUS[selected.status])} disabled={saving}
                className="w-full rounded-xl bg-[#B8860B] py-2 text-sm font-bold text-white disabled:opacity-50">
                {saving?'...':`نقل إلى: ${STATUS_AR[NEXT_STATUS[selected.status]]}`}
              </button>
            )}
            {selected.status==='pending' && (
              <button onClick={()=>void setStatus(selected, 'rejected')} disabled={saving}
                className="w-full rounded-xl border border-red-200 bg-red-50 py-2 text-sm font-bold text-red-700 hover:bg-red-100 disabled:opacity-50">
                رفض الطلب
              </button>
            )}
            <Link href={`/exchanges/${selected.id}`} className="block w-full rounded-xl border border-[#E5E0D8] py-2 text-center text-sm font-bold text-[#57534E] hover:border-[#B8860B] hover:text-[#B8860B]">
              عرض كل التفاصيل والصور ←
            </Link>
          </div>
        </Modal>
      )}
    </div>
  );
}
