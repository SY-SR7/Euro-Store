'use client';
import { useEffect, useState, useCallback } from 'react';

interface Rate {
  id:string; currency:string; rate_to_syp:number; is_active:boolean;
  source?:string|null; last_updated?:string|null; created_at?:string;
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

export default function AdminExchangePage() {
  const [rates,setRates] = useState<Rate[]>([]);
  const [loading,setLoading] = useState(true);
  const [selected,setSelected] = useState<Rate|null>(null);
  const [newRate,setNewRate] = useState('');
  const [source,setSource] = useState('');
  const [saving,setSaving] = useState(false);
  const [msg,setMsg] = useState('');
  const [showCreate,setShowCreate] = useState(false);
  const [newForm,setNewForm] = useState({currency:'USD',rate_to_syp:'',source:'manual'});
  const [creating,setCreating] = useState(false);

  const load = useCallback(async()=>{
    setLoading(true);
    const d = await fetch('/api/exchange-rates',{cache:'no-store'}).then(r=>r.json()).catch(()=>[]);
    setRates(Array.isArray(d)?d:[]);
    setLoading(false);
  },[]);
  useEffect(()=>{ void load(); },[load]);

  const open = (r:Rate) => { setSelected(r); setNewRate(String(r.rate_to_syp)); setSource(r.source??'manual'); setMsg(''); };

  const save = async () => {
    if (!selected||!newRate) return;
    setSaving(true); setMsg('');
    const res = await fetch(`/api/exchange-rates/${selected.id}`,{
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({rate_to_syp:Number(newRate),source:source||'manual',last_updated:new Date().toISOString()})
    });
    if (res.ok) {
      const u={...selected,rate_to_syp:Number(newRate),source,last_updated:new Date().toISOString()};
      setSelected(u); setRates(rs=>rs.map(r=>r.id===selected.id?u:r));
      setMsg('✓ تم تحديث السعر');
    } else setMsg('✗ فشل التحديث');
    setSaving(false);
  };

  const create = async () => {
    if (!newForm.currency||!newForm.rate_to_syp) return;
    setCreating(true);
    const res = await fetch('/api/exchange-rates',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({currency:newForm.currency.toUpperCase(),rate_to_syp:Number(newForm.rate_to_syp),source:newForm.source||'manual',is_active:true})});
    if (res.ok) { setNewForm({currency:'USD',rate_to_syp:'',source:'manual'}); setShowCreate(false); void load(); }
    setCreating(false);
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-black text-[#1C1917]">أسعار الصرف</h1><p className="mt-1 text-sm text-[#A8A29E]">{rates.length} عملة</p></div>
        <button onClick={()=>setShowCreate(v=>!v)} className="rounded-xl bg-[#B8860B] px-5 py-2.5 text-sm font-black text-[#1F1B16] hover:bg-[#9A7209]">{showCreate?'إلغاء':'+ إضافة عملة'}</button>
      </div>

      {showCreate&&(
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-black text-[#B8860B]">إضافة سعر صرف</h2>
          <div className="grid gap-3 sm:grid-cols-4">
            <input value={newForm.currency} onChange={e=>setNewForm(f=>({...f,currency:e.target.value.toUpperCase()}))} placeholder="USD" maxLength={3} className="rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm font-mono outline-none focus:border-[#B8860B]" dir="ltr"/>
            <input type="number" value={newForm.rate_to_syp} onChange={e=>setNewForm(f=>({...f,rate_to_syp:e.target.value}))} placeholder="السعر بالليرة" className="rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]"/>
            <input value={newForm.source} onChange={e=>setNewForm(f=>({...f,source:e.target.value}))} placeholder="المصدر" className="rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]"/>
            <button onClick={create} disabled={creating||!newForm.rate_to_syp} className="rounded-xl bg-[#B8860B] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{creating?'...':'إضافة'}</button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading?<p className="col-span-full p-10 text-center text-sm text-[#A8A29E]">جارٍ التحميل...</p>
        :rates.map(r=>(
          <div key={r.id} onClick={()=>open(r)} className="cursor-pointer rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm hover:border-[#B8860B] hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="text-3xl font-black text-[#1C1917] font-mono">{r.currency}</div>
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${r.is_active?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-700 border-red-200'}`}>{r.is_active?'نشط':'معطّل'}</span>
            </div>
            <div className="mt-4 text-2xl font-black text-[#B8860B]">{Number(r.rate_to_syp).toLocaleString('ar-SY')} <span className="text-sm">ل.س</span></div>
            <p className="mt-2 text-xs text-[#A8A29E]">آخر تحديث: {r.last_updated?new Date(r.last_updated).toLocaleString('ar-SY'):'—'}</p>
          </div>
        ))}
      </div>

      {selected&&(
        <Modal title={`تعديل ${selected.currency}`} onClose={()=>setSelected(null)}>
          {msg&&<div className={`mb-4 rounded-xl px-4 py-2 text-sm ${msg.startsWith('✓')?'bg-green-50 text-green-700 border border-green-200':'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}
          <div className="space-y-4">
            <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">السعر مقابل الليرة السورية</label><input type="number" value={newRate} onChange={e=>setNewRate(e.target.value)} className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]" dir="ltr"/></div>
            <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">المصدر</label><input value={source} onChange={e=>setSource(e.target.value)} className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]"/></div>
            <button onClick={save} disabled={saving||!newRate} className="w-full rounded-xl bg-[#B8860B] py-2.5 text-sm font-bold text-white hover:bg-[#9A7209] disabled:opacity-50">{saving?'جارٍ الحفظ...':'حفظ السعر الجديد'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}