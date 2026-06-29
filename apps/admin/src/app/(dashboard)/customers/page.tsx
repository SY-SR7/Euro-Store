'use client';
import { useEffect, useState, useCallback } from 'react';

interface Customer {
  id: string; full_name: string|null; phone: string|null;
  email: string|null; created_at: string; loyalty_points?: number|null; referral_code?: string|null;
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

export default function AdminCustomersPage() {
  const [customers,setCustomers] = useState<Customer[]>([]);
  const [loading,setLoading]    = useState(true);
  const [search,setSearch]      = useState('');
  const [selected,setSelected]  = useState<Customer|null>(null);
  const [adjustPoints,setAdjustPoints] = useState('');
  const [adjustReason,setAdjustReason] = useState('');
  const [saving,setSaving]      = useState(false);
  const [msg,setMsg]            = useState('');
  const [editName,setEditName]  = useState('');
  const [editPhone,setEditPhone]= useState('');
  const [editEmail,setEditEmail]= useState('');
  const [editMode,setEditMode]  = useState(false);

  const load = useCallback(()=>{
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    fetch(`/api/customers?${p}`,{cache:'no-store'})
      .then(r=>r.json()).then(d=>setCustomers(Array.isArray(d)?d:[]))
      .catch(()=>setCustomers([])).finally(()=>setLoading(false));
  },[search]);

  useEffect(()=>{ load(); },[load]);

  const open = (c:Customer) => {
    setSelected(c); setMsg(''); setAdjustPoints(''); setAdjustReason('');
    setEditName(c.full_name??''); setEditPhone(c.phone??''); setEditEmail(c.email??'');
    setEditMode(false);
  };

  const handleAdjust = async () => {
    if (!selected||!adjustPoints) return;
    setSaving(true); setMsg('');
    const pts = parseInt(adjustPoints);
    if (isNaN(pts)) { setMsg('✗ أدخل رقماً صحيحاً'); setSaving(false); return; }
    const res = await fetch(`/api/customers/${selected.id}/loyalty`,{
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ points:pts, reason:adjustReason||'تعديل يدوي' }),
    });
    if (res.ok) {
      const newPts = (selected.loyalty_points??0)+pts;
      const u = {...selected, loyalty_points:newPts};
      setSelected(u); setCustomers(cs=>cs.map(c=>c.id===selected.id?{...c,loyalty_points:newPts}:c));
      setMsg('✓ تم تعديل النقاط'); setAdjustPoints(''); setAdjustReason('');
    } else { setMsg('✗ فشل التعديل'); }
    setSaving(false);
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    setSaving(true); setMsg('');
    const res = await fetch(`/api/customers/${selected.id}`,{
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ full_name:editName, phone:editPhone, email:editEmail }),
    });
    if (res.ok) {
      const u = {...selected, full_name:editName, phone:editPhone, email:editEmail};
      setSelected(u); setCustomers(cs=>cs.map(c=>c.id===selected.id?{...c,...u}:c));
      setMsg('✓ تم الحفظ'); setEditMode(false);
    } else { setMsg('✗ فشل الحفظ'); }
    setSaving(false);
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <div><h1 className="text-2xl font-black text-[#1C1917]">العملاء</h1><p className="mt-1 text-sm text-[#A8A29E]">{customers.length} عميل</p></div>
        <button onClick={load} className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#57534E] hover:border-[#B8860B]">تحديث ↻</button>
      </div>
      <div className="rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث بالاسم أو الهاتف..." className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]"/>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading?<p className="p-10 text-center text-sm text-[#A8A29E]">جارٍ التحميل...</p>
        :customers.length===0?<p className="p-10 text-center text-sm text-[#A8A29E]">لا يوجد عملاء</p>
        :(
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]"><tr>
                {['الاسم','الهاتف','النقاط','تاريخ التسجيل'].map((h,i)=><th key={i} className={`px-5 py-3 text-right text-xs font-black text-[#A8A29E] ${i>=2?'hidden md:table-cell':''}`}>{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {customers.map(c=>(
                  <tr key={c.id} className="group hover:bg-[#FFFBF0] cursor-pointer transition-colors" onClick={()=>open(c)}>
                    <td className="px-5 py-3 font-semibold text-[#1C1917] group-hover:text-[#B8860B] transition-colors">{c.full_name??'—'}</td>
                    <td className="px-5 py-3 text-[#57534E]" dir="ltr">{c.phone??''}</td>
                    <td className="px-5 py-3 font-bold text-[#B8860B] hidden md:table-cell">{c.loyalty_points??0}</td>
                    <td className="px-5 py-3 text-xs text-[#A8A29E] hidden md:table-cell">{new Date(c.created_at).toLocaleDateString('ar-SY')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected&&(
        <Modal title={selected.full_name??'عميل'} onClose={()=>setSelected(null)}>
          {msg&&<div className={`mb-4 rounded-xl px-4 py-2 text-sm ${msg.startsWith('✓')?'bg-green-50 text-green-700 border border-green-200':'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}
          <div className="space-y-4">
            {editMode?(
              <div className="space-y-3">
                <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">الاسم الكامل</label><input value={editName} onChange={e=>setEditName(e.target.value)} className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]"/></div>
                <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">الهاتف</label><input value={editPhone} onChange={e=>setEditPhone(e.target.value)} dir="ltr" className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]"/></div>
                <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">البريد</label><input value={editEmail} onChange={e=>setEditEmail(e.target.value)} dir="ltr" className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]"/></div>
                <div className="flex gap-2">
                  <button onClick={handleSaveEdit} disabled={saving} className="flex-1 rounded-xl bg-[#B8860B] py-2 text-sm font-bold text-white disabled:opacity-50">{saving?'...':'حفظ'}</button>
                  <button onClick={()=>setEditMode(false)} className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold">إلغاء</button>
                </div>
              </div>
            ):(
              <div className="space-y-3 text-sm">
                {([['الاسم',selected.full_name],['الهاتف',selected.phone],['البريد',selected.email],['كود الإحالة',selected.referral_code],['النقاط',String(selected.loyalty_points??0)],['تاريخ التسجيل',new Date(selected.created_at).toLocaleDateString('ar-SY')]] as [string,string|null|undefined][]).map(([l,v])=>(
                  <div key={l} className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">{l}</span><span className="font-semibold text-[#1C1917]" dir={l==='الهاتف'||l==='البريد'?'ltr':'rtl'}>{v??''}</span></div>
                ))}
                <button onClick={()=>setEditMode(true)} className="w-full rounded-xl border border-[#B8860B] py-2 text-sm font-bold text-[#B8860B] hover:bg-[#B8860B]/10">✎ تعديل بيانات العميل</button>
              </div>
            )}

            <div className="rounded-2xl border border-[#F0ECE6] bg-[#FAFAF8] p-4">
              <h3 className="mb-3 font-black text-[#B8860B] text-sm">تعديل نقاط الولاء</h3>
              <div className="space-y-2">
                <input type="number" value={adjustPoints} onChange={e=>setAdjustPoints(e.target.value)} placeholder="عدد النقاط (+ أو -)" className="w-full rounded-xl border border-[#E5E0D8] bg-white px-3 py-2 text-sm outline-none focus:border-[#B8860B]" dir="ltr"/>
                <input value={adjustReason} onChange={e=>setAdjustReason(e.target.value)} placeholder="السبب" className="w-full rounded-xl border border-[#E5E0D8] bg-white px-3 py-2 text-sm outline-none focus:border-[#B8860B]"/>
                <button onClick={handleAdjust} disabled={saving||!adjustPoints} className="w-full rounded-xl bg-[#B8860B] py-2 text-sm font-bold text-white disabled:opacity-50">تطبيق التعديل</button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}