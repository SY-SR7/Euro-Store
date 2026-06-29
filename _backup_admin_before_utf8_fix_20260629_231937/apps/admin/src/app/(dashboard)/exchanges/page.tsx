'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Exchange {
  id: string; order_id?: string|null; customer_id?: string|null;
  reason: string; status: string; created_at: string; notes?: string|null;
}
const STATUS_AR: Record<string,string> = { pending:'????', approved:'????? ????', qr_generated:'QR ?????', qr_scanned:'QR ?????', completed:'?????', rejected:'?????', expired:'?????' };
const STATUS_COLOR: Record<string,string> = { pending:'bg-yellow-50 text-yellow-700 border-yellow-200', approved:'bg-blue-50 text-blue-700 border-blue-200', qr_generated:'bg-purple-50 text-purple-700 border-purple-200', qr_scanned:'bg-indigo-50 text-indigo-700 border-indigo-200', completed:'bg-green-50 text-green-700 border-green-200', rejected:'bg-red-50 text-red-700 border-red-200', expired:'bg-gray-100 text-gray-500 border-gray-200' };
const TRANSITIONS: Record<string,string[]> = { pending:['approved','rejected'], approved:['qr_generated','rejected'], qr_generated:['qr_scanned'], qr_scanned:['completed'], completed:[], rejected:[], expired:[] };

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
  const [exchanges,setExchanges] = useState<Exchange[]>([]);
  const [loading,setLoading]    = useState(true);
  const [filter,setFilter]      = useState('');
  const [selected,setSelected]  = useState<Exchange|null>(null);
  const [notes,setNotes]        = useState('');
  const [updating,setUpdating]  = useState(false);
  const [msg,setMsg]            = useState('');

  const load = useCallback(()=>{
    setLoading(true);
    const p = new URLSearchParams();
    if (filter) p.set('status', filter);
    fetch(`/api/exchanges?${p}`,{cache:'no-store'})
      .then(r=>r.json()).then(d=>setExchanges(Array.isArray(d)?d:[]))
      .catch(()=>setExchanges([])).finally(()=>setLoading(false));
  },[filter]);

  useEffect(()=>{ load(); },[load]);

  const open = (e:Exchange) => { setSelected(e); setNotes(e.notes??''); setMsg(''); };

  const changeStatus = async (ex:Exchange, s:string) => {
    setUpdating(true); setMsg('');
    const res = await fetch(`/api/exchanges/${ex.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:s,notes})});
    if (res.ok) {
      const u={...ex,status:s,notes};
      setSelected(u); setExchanges(es=>es.map(x=>x.id===ex.id?u:x));
      setMsg(`? ??????: ${STATUS_AR[s]??s}`);
    } else setMsg('? ???');
    setUpdating(false);
  };

  const saveNotes = async (ex:Exchange) => {
    setUpdating(true);
    const res = await fetch(`/api/exchanges/${ex.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({notes})});
    if (res.ok) { setSelected({...ex,notes}); setMsg('? ?? ??? ?????????'); } else setMsg('? ???');
    setUpdating(false);
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <div><h1 className="text-2xl font-black text-[#1C1917]">????? ?????????</h1><p className="mt-1 text-sm text-[#A8A29E]">{exchanges.length} ???</p></div>
        <button onClick={load} className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#57534E] hover:border-[#B8860B]">????? ?</button>
      </div>
      <div className="flex flex-wrap gap-2 rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
        {([['','????'],...Object.entries(STATUS_AR)] as [string,string][]).map(([k,v])=>(
          <button key={k} onClick={()=>setFilter(k)} className={['rounded-xl px-3 py-1.5 text-xs font-bold border transition-colors',filter===k?'bg-[#B8860B] text-white border-[#B8860B]':'border-[#E5E0D8] text-[#57534E] hover:border-[#B8860B]'].join(' ')}>{v}</button>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading?<p className="p-10 text-center text-sm text-[#A8A29E]">???? ???????...</p>
        :exchanges.length===0?<p className="p-10 text-center text-sm text-[#A8A29E]">?? ???? ?????</p>
        :(
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]"><tr>
                {['?????','??????','???????'].map((h,i)=><th key={i} className="px-5 py-3 text-right text-xs font-black text-[#A8A29E]">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {exchanges.map(e=>(
                  <tr key={e.id} className="group hover:bg-[#FFFBF0] cursor-pointer transition-colors" onClick={()=>open(e)}>
                    <td className="px-5 py-3 text-[#1C1917] max-w-[250px] truncate group-hover:text-[#B8860B] transition-colors">{e.reason}</td>
                    <td className="px-5 py-3"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${STATUS_COLOR[e.status]??'bg-gray-100 text-gray-500 border-gray-200'}`}>{STATUS_AR[e.status]??e.status}</span></td>
                    <td className="px-5 py-3 text-xs text-[#A8A29E]">{new Date(e.created_at).toLocaleDateString('ar-SY')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected&&(
        <Modal title="??? ???????" onClose={()=>setSelected(null)}>
          {msg&&<div className={`mb-4 rounded-xl px-4 py-2 text-sm ${msg.startsWith('?')?'bg-green-50 text-green-700 border border-green-200':'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}
          <div className="space-y-3 text-sm">
            <div className="border-b border-[#F0ECE6] pb-3"><p className="mb-1 text-xs text-[#A8A29E]">?????</p><p className="text-[#1C1917] leading-relaxed">{selected.reason}</p></div>
            <div className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">???????</span><span>{new Date(selected.created_at).toLocaleDateString('ar-SY')}</span></div>
            <div className="flex items-center justify-between border-b border-[#F0ECE6] pb-2">
              <span className="text-[#A8A29E]">??????</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${STATUS_COLOR[selected.status]??''}`}>{STATUS_AR[selected.status]??selected.status}</span>
            </div>
            <div className="border-b border-[#F0ECE6] pb-3">
              <label className="mb-1.5 block text-xs font-bold text-[#A8A29E]">??????? ???????</label>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]" />
              <button onClick={()=>void saveNotes(selected)} disabled={updating} className="mt-2 rounded-xl border border-[#B8860B] px-4 py-1.5 text-xs font-bold text-[#B8860B] hover:bg-[#B8860B]/10">??? ?????????</button>
            </div>
            {(TRANSITIONS[selected.status]??[]).length>0&&(
              <div>
                <p className="mb-2 text-xs font-bold text-[#A8A29E]">????? ?????? ???:</p>
                <div className="flex flex-wrap gap-2">
                  {(TRANSITIONS[selected.status]??[]).map(s=>(
                    <button key={s} onClick={()=>void changeStatus(selected,s)} disabled={updating}
                      className={`rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-50 transition-colors ${s==='rejected'?'bg-red-500 hover:bg-red-600':'bg-[#B8860B] hover:bg-[#9A7209]'}`}>
                      ? {STATUS_AR[s]}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {selected.order_id&&(
              <div className="pt-3 border-t border-[#F0ECE6]">
                <Link href={`/orders/${selected.order_id}`} className="font-bold text-[#B8860B] hover:underline text-sm">??? ????? ??????? ?</Link>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
