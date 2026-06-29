'use client';
import { useEffect, useState, useCallback } from 'react';

interface Discount {
  id: string; code: string; type: string; value: number;
  min_order_syp?: number|null; valid_from?: string|null; valid_until?: string|null;
  max_uses?: number|null; used_count?: number|null; is_active: boolean;
}
function pickArray<T>(p: unknown): T[] {
  if (Array.isArray(p)) return p as T[];
  if (p&&typeof p==='object') { const o=p as Record<string,unknown>; for (const k of ['data','items','discounts']) { if (Array.isArray(o[k])) return o[k] as T[]; } }
  return [];
}
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

export default function AdminDiscountsPage() {
  const [discounts,setDiscounts] = useState<Discount[]>([]);
  const [loading,setLoading]    = useState(true);
  const [selected,setSelected]  = useState<Discount|null>(null);
  const [editing,setEditing]    = useState(false);
  const [draft,setDraft]        = useState<Partial<Discount&{valid_from_date:string;valid_until_date:string}>>({});
  const [saving,setSaving]      = useState(false);
  const [msg,setMsg]            = useState('');
  const [showCreate,setShowCreate] = useState(false);
  const [newForm,setNewForm]    = useState({code:'',type:'percentage',value:'',min_order_syp:'',valid_from:'',valid_until:'',max_uses:''});
  const [creating,setCreating]  = useState(false);

  const load = useCallback(async()=>{
    setLoading(true);
    const d = await fetch('/api/discounts',{cache:'no-store'}).then(r=>r.json()).catch(()=>[]);
    setDiscounts(pickArray<Discount>(d)); setLoading(false);
  },[]);
  useEffect(()=>{ void load(); },[load]);

  const open = (d:Discount) => { setSelected(d); setEditing(false); setDraft({}); setMsg(''); };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true); setMsg('');
    const body:Record<string,unknown> = {...draft};
    if (draft.valid_from_date!==undefined) body.valid_from = draft.valid_from_date||null;
    if (draft.valid_until_date!==undefined) body.valid_until = draft.valid_until_date||null;
    delete body.valid_from_date; delete body.valid_until_date;
    const res = await fetch(`/api/discounts/${selected.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    if (res.ok) {
      const u={...selected,...body} as Discount;
      setSelected(u); setDiscounts(ds=>ds.map(d=>d.id===selected.id?u:d));
      setMsg('✓ تم الحفظ'); setEditing(false);
    } else setMsg('✗ فشل');
    setSaving(false);
  };

  const toggleActive = async (d:Discount,e:React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/discounts/${d.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({is_active:!d.is_active})});
    if (selected?.id===d.id) setSelected({...d,is_active:!d.is_active});
    void load();
  };

  const createDiscount = async () => {
    if (!newForm.code||!newForm.value) return;
    setCreating(true);
    const body:Record<string,unknown> = {code:newForm.code.toUpperCase(),type:newForm.type,value:Number(newForm.value),is_active:true};
    if (newForm.min_order_syp) body.min_order_syp=Number(newForm.min_order_syp);
    if (newForm.valid_from) body.valid_from=newForm.valid_from;
    if (newForm.valid_until) body.valid_until=newForm.valid_until;
    if (newForm.max_uses) body.max_uses=Number(newForm.max_uses);
    const res = await fetch('/api/discounts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    if (res.ok) { setNewForm({code:'',type:'percentage',value:'',min_order_syp:'',valid_from:'',valid_until:'',max_uses:''}); setShowCreate(false); void load(); }
    setCreating(false);
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-black text-[#1C1917]">الخصومات</h1><p className="mt-1 text-sm text-[#A8A29E]">{discounts.length} كود خصم</p></div>
        <button onClick={()=>setShowCreate(v=>!v)} className="rounded-xl bg-[#B8860B] px-5 py-2.5 text-sm font-black text-[#1F1B16] hover:bg-[#9A7209]">{showCreate?'إلغاء':'+ كود جديد'}</button>
      </div>

      {showCreate&&(
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-black text-[#B8860B]">إضافة كود خصم جديد</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={newForm.code} onChange={e=>setNewForm(f=>({...f,code:e.target.value.toUpperCase()}))} placeholder="الكود *" className="rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B] font-mono" dir="ltr"/>
            <select value={newForm.type} onChange={e=>setNewForm(f=>({...f,type:e.target.value}))} className="rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]">
              <option value="percentage">خصم نسبة مئوية (%)</option>
              <option value="fixed">خصم مبلغ ثابت (ل.س)</option>
            </select>
            <input type="number" value={newForm.value} onChange={e=>setNewForm(f=>({...f,value:e.target.value}))} placeholder={`القيمة * ${newForm.type==='percentage'?'(%)':'(ل.س)'}`} className="rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]"/>
            <input type="number" value={newForm.min_order_syp} onChange={e=>setNewForm(f=>({...f,min_order_syp:e.target.value}))} placeholder="الحد الأدنى للطلب (ل.س)" className="rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]"/>
            <input type="date" value={newForm.valid_from} onChange={e=>setNewForm(f=>({...f,valid_from:e.target.value}))} className="rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]" dir="ltr"/>
            <input type="date" value={newForm.valid_until} onChange={e=>setNewForm(f=>({...f,valid_until:e.target.value}))} className="rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]" dir="ltr"/>
            <input type="number" value={newForm.max_uses} onChange={e=>setNewForm(f=>({...f,max_uses:e.target.value}))} placeholder="الحد الأقصى للاستخدامات" className="rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]"/>
            <button onClick={createDiscount} disabled={creating||!newForm.code||!newForm.value} className="sm:col-start-2 rounded-xl bg-[#B8860B] py-2 text-sm font-bold text-white disabled:opacity-50">{creating?'...':'إنشاء الكود'}</button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading?<p className="p-10 text-center text-sm text-[#A8A29E]">جارٍ التحميل...</p>
        :discounts.length===0?<p className="p-10 text-center text-sm text-[#A8A29E]">لا توجد أكواد خصم</p>
        :(
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]"><tr>
                {['الكود','النوع','القيمة','الاستخدامات','الحالة'].map((h,i)=>(
                  <th key={i} className={`px-5 py-3 text-right text-xs font-black text-[#A8A29E] ${i>=3?'hidden md:table-cell':''}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {discounts.map(d=>(
                  <tr key={d.id} className="group hover:bg-[#FFFBF0] cursor-pointer transition-colors" onClick={()=>open(d)}>
                    <td className="px-5 py-3 font-mono font-bold text-[#1C1917] group-hover:text-[#B8860B] transition-colors">{d.code}</td>
                    <td className="px-5 py-3 text-[#57534E]">{d.type==='percentage'?'نسبة':'ثابت'}</td>
                    <td className="px-5 py-3 font-bold text-[#B8860B]">{d.value}{d.type==='percentage'?'%':' ل.س'}</td>
                    <td className="px-5 py-3 text-xs text-[#A8A29E] hidden md:table-cell">{d.used_count??0}{d.max_uses?` / ${d.max_uses}`:''}</td>
                    <td className="px-5 py-3 hidden md:table-cell" onClick={e=>void toggleActive(d,e)}>
                      <span className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-bold ${d.is_active?'bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200':'bg-red-50 text-red-700 border-red-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200'} transition-colors`}>
                        {d.is_active?'نشط':'معطّل'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected&&(
        <Modal title={`كود: ${selected.code}`} onClose={()=>setSelected(null)}>
          {msg&&<div className={`mb-4 rounded-xl px-4 py-2 text-sm ${msg.startsWith('✓')?'bg-green-50 text-green-700 border border-green-200':'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}
          {editing?(
            <div className="space-y-3">
              <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">الكود</label><input value={String(draft.code??selected.code)} onChange={e=>setDraft(d=>({...d,code:e.target.value.toUpperCase()}))} className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm font-mono outline-none focus:border-[#B8860B]" dir="ltr"/></div>
              <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">النوع</label><select value={String(draft.type??selected.type)} onChange={e=>setDraft(d=>({...d,type:e.target.value}))} className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]"><option value="percentage">نسبة %</option><option value="fixed">مبلغ ثابت</option></select></div>
              <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">القيمة</label><input type="number" value={String(draft.value??selected.value)} onChange={e=>setDraft(d=>({...d,value:Number(e.target.value)}))} className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]"/></div>
              <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">صالح من</label><input type="date" value={String(draft.valid_from_date??selected.valid_from?.substring(0,10)??'')} onChange={e=>setDraft(d=>({...d,valid_from_date:e.target.value}))} className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]" dir="ltr"/></div>
              <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">صالح حتى</label><input type="date" value={String(draft.valid_until_date??selected.valid_until?.substring(0,10)??'')} onChange={e=>setDraft(d=>({...d,valid_until_date:e.target.value}))} className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]" dir="ltr"/></div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-[#57534E]">نشط</label>
                <button onClick={()=>setDraft(d=>({...d,is_active:!(d.is_active??selected.is_active)}))} className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${(draft.is_active??selected.is_active)?'bg-[#B8860B]':'bg-gray-300'}`}>
                  <span className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${(draft.is_active??selected.is_active)?'translate-x-[-1.375rem]':'translate-x-[-0.125rem]'}`}/>
                </button>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={saveEdit} disabled={saving} className="flex-1 rounded-xl bg-[#B8860B] py-2 text-sm font-bold text-white disabled:opacity-50">{saving?'...':'حفظ'}</button>
                <button onClick={()=>setEditing(false)} className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#57534E]">إلغاء</button>
              </div>
            </div>
          ):(
            <div className="space-y-3 text-sm">
              {([['الكود',selected.code],['النوع',selected.type==='percentage'?'خصم نسبة':'خصم ثابت'],['القيمة',`${selected.value}${selected.type==='percentage'?'%':' ل.س'}`],['الحد الأدنى',selected.min_order_syp?`${Number(selected.min_order_syp).toLocaleString('ar-SY')} ل.س`:'' ],['صالح من',selected.valid_from?new Date(selected.valid_from).toLocaleDateString('ar-SY'):'' ],['صالح حتى',selected.valid_until?new Date(selected.valid_until).toLocaleDateString('ar-SY'):'' ],['الاستخدامات',`${selected.used_count??0}${selected.max_uses?` / ${selected.max_uses}`:''}`]] as [string,string][]).map(([l,v])=>(
                <div key={l} className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">{l}</span><span className="font-semibold text-[#1C1917]">{v}</span></div>
              ))}
              <div className="flex justify-between border-b border-[#F0ECE6] pb-2">
                <span className="text-[#A8A29E]">الحالة</span>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${selected.is_active?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-700 border-red-200'}`}>{selected.is_active?'نشط':'معطّل'}</span>
              </div>
              <button onClick={()=>{ setDraft({...selected,valid_from_date:selected.valid_from?.substring(0,10)??'',valid_until_date:selected.valid_until?.substring(0,10)??''}); setEditing(true); }} className="w-full rounded-xl border border-[#B8860B] py-2 text-sm font-bold text-[#B8860B] hover:bg-[#B8860B]/10">✎ تعديل</button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}