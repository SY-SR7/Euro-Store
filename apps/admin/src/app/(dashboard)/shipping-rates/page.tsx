'use client';
import { useEffect, useState, useCallback } from 'react';

interface Rate {
  id:string; governorate:string; base_rate_syp:number;
  free_shipping_threshold_syp?:number|null; estimated_days?:number|null; is_active:boolean;
}
function Modal({ title, onClose, children }: { title:string; onClose:()=>void; children:React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl border border-[#E5E0D8] bg-white shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] px-6 py-4">
          <h2 className="font-black text-[#1C1917]">{title}</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F8F6F2] text-[#A8A29E] hover:bg-[#E5E0D8] text-lg">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AdminShippingRatesPage() {
  const [rates,setRates] = useState<Rate[]>([]);
  const [loading,setLoading] = useState(true);
  const [selected,setSelected] = useState<Rate|null>(null);
  const [draft,setDraft] = useState({base_rate_syp:'',free_shipping_threshold_syp:'',is_active:true});
  const [saving,setSaving] = useState(false);
  const [msg,setMsg] = useState('');

  const load = useCallback(async()=>{
    setLoading(true);
    const d = await fetch('/api/shipping-rates',{cache:'no-store'}).then(r=>r.json()).catch(()=>[]);
    setRates(Array.isArray(d)?d:[]);
    setLoading(false);
  },[]);
  useEffect(()=>{ void load(); },[load]);

  const open = (r:Rate) => {
    setSelected(r); setMsg('');
    setDraft({base_rate_syp:String(r.base_rate_syp),free_shipping_threshold_syp:r.free_shipping_threshold_syp?String(r.free_shipping_threshold_syp):'',is_active:r.is_active});
  };

  const save = async () => {
    if (!selected||!draft.base_rate_syp) return;
    setSaving(true); setMsg('');
    const body = {base_rate_syp:Number(draft.base_rate_syp),free_shipping_threshold_syp:draft.free_shipping_threshold_syp?Number(draft.free_shipping_threshold_syp):null,is_active:draft.is_active};
    const res = await fetch(`/api/shipping-rates/${selected.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    if (res.ok) {
      const u={...selected,...body};
      setSelected(u); setRates(rs=>rs.map(r=>r.id===selected.id?u:r)); setMsg('✓ تم الحفظ');
    } else setMsg('✗ فشل الحفظ');
    setSaving(false);
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <div><h1 className="text-2xl font-black text-[#1C1917]">أسعار الشحن</h1><p className="mt-1 text-sm text-[#A8A29E]">{rates.length} محافظة</p></div>
        <button onClick={load} className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#57534E] hover:border-[#B8860B]">تحديث ↻</button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading?<p className="p-10 text-center text-sm text-[#A8A29E]">جارٍ التحميل...</p>
        :rates.length===0?<p className="p-10 text-center text-sm text-[#A8A29E]">لا توجد أسعار شحن</p>
        :(
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]"><tr>
                {['المحافظة','سعر الشحن','شحن مجاني فوق','الحالة'].map((h,i)=>(
                  <th key={i} className={`px-5 py-3 text-right text-xs font-black text-[#A8A29E] ${i>=2?'hidden md:table-cell':''}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {rates.map(r=>(
                  <tr key={r.id} className="group hover:bg-[#FFFBF0] cursor-pointer transition-colors" onClick={()=>open(r)}>
                    <td className="px-5 py-3 font-semibold text-[#1C1917] group-hover:text-[#B8860B] transition-colors">{r.governorate}</td>
                    <td className="px-5 py-3 font-bold text-[#B8860B]">{Number(r.base_rate_syp).toLocaleString('ar-SY')} ل.س</td>
                    <td className="px-5 py-3 text-xs text-[#A8A29E] hidden md:table-cell">{r.free_shipping_threshold_syp?`${Number(r.free_shipping_threshold_syp).toLocaleString('ar-SY')} ل.س`:''}</td>
                    <td className="px-5 py-3 hidden md:table-cell"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${r.is_active?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-700 border-red-200'}`}>{r.is_active?'نشط':'معطّل'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected&&(
        <Modal title={selected.governorate} onClose={()=>setSelected(null)}>
          {msg&&<div className={`mb-4 rounded-xl px-4 py-2 text-sm ${msg.startsWith('✓')?'bg-green-50 text-green-700 border border-green-200':'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}
          <div className="space-y-4">
            <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">سعر الشحن (ل.س)</label><input type="number" value={draft.base_rate_syp} onChange={e=>setDraft(d=>({...d,base_rate_syp:e.target.value}))} className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]"/></div>
            <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">شحن مجاني فوق (ل.س) — اتركه فارغاً لتعطيل الشحن المجاني</label><input type="number" value={draft.free_shipping_threshold_syp} onChange={e=>setDraft(d=>({...d,free_shipping_threshold_syp:e.target.value}))} className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]"/></div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-[#57534E]">نشط</label>
              <button onClick={()=>setDraft(d=>({...d,is_active:!d.is_active}))} className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${draft.is_active?'bg-[#B8860B]':'bg-gray-300'}`}>
                <span className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${draft.is_active?'translate-x-[-1.375rem]':'translate-x-[-0.125rem]'}`}/>
              </button>
            </div>
            <button onClick={save} disabled={saving} className="w-full rounded-xl bg-[#B8860B] py-2.5 text-sm font-bold text-white hover:bg-[#9A7209] disabled:opacity-50">{saving?'...':'حفظ التعديلات'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}