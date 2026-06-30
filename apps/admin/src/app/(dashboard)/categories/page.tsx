'use client';
// @ts-nocheck
import { useEffect, useState, useCallback } from 'react';
import CategoriesQuickAdmin from './CategoriesQuickAdmin';

export default CategoriesQuickAdmin;

interface Category {
  id: string; name_ar: string|null; name_en: string|null;
  slug: string|null; sort_order: number|null; is_active: boolean|null; image_url?: string|null;
}
function Modal({ title, onClose, children }: { title:string; onClose:()=>void; children:React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl border border-[#E5E0D8] bg-white shadow-2xl max-h-[90vh] flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] px-6 py-4">
          <h2 className="font-black text-[#1C1917]">{title}</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F8F6F2] text-[#A8A29E] hover:bg-[#E5E0D8] text-lg">×</button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function LegacyAdminCategoriesPage() {
  const [categories,setCategories] = useState<Category[]>([]);
  const [loading,setLoading]      = useState(true);
  const [selected,setSelected]    = useState<Category|null>(null);
  const [editing,setEditing]      = useState(false);
  const [draft,setDraft]          = useState<Partial<Category>>({});
  const [saving,setSaving]        = useState(false);
  const [msg,setMsg]              = useState('');
  const [newForm,setNewForm]      = useState({ name_ar:'', name_en:'', slug:'', sort_order:'0' });
  const [creating,setCreating]    = useState(false);
  const [showCreate,setShowCreate]= useState(false);

  const load = useCallback(async()=>{
    setLoading(true);
    const res = await fetch('/api/catalog/categories',{cache:'no-store'});
    const d = await res.json().catch(()=>[]);
    setCategories(Array.isArray(d)?d:[]); setLoading(false);
  },[]);
  useEffect(()=>{ void load(); },[load]);

  const open = (c:Category) => { setSelected(c); setEditing(false); setDraft({}); setMsg(''); };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true); setMsg('');
    const res = await fetch(`/api/catalog/categories/${selected.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(draft)});
    if (res.ok) {
      const u={...selected,...draft} as Category;
      setSelected(u); setCategories(cs=>cs.map(c=>c.id===selected.id?u:c));
      setMsg('✓ تم الحفظ'); setEditing(false);
    } else setMsg('✗ فشل');
    setSaving(false);
  };

  const createCat = async () => {
    if (!newForm.name_ar) return;
    setCreating(true);
    const res = await fetch('/api/catalog/categories',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...newForm,sort_order:Number(newForm.sort_order)||0})});
    if (res.ok) { setNewForm({name_ar:'',name_en:'',slug:'',sort_order:'0'}); setShowCreate(false); void load(); }
    setCreating(false);
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-black text-[#1C1917]">التصنيفات</h1><p className="mt-1 text-sm text-[#A8A29E]">{categories.length} قسم</p></div>
        <button onClick={()=>setShowCreate(v=>!v)} className="rounded-xl bg-[#B8860B] px-5 py-2.5 text-sm font-black text-[#1F1B16] hover:bg-[#9A7209]">{showCreate?'إلغاء':'+ إضافة قسم'}</button>
      </div>

      {showCreate&&(
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-black text-[#B8860B]">قسم جديد</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={newForm.name_ar} onChange={e=>setNewForm(f=>({...f,name_ar:e.target.value}))} placeholder="الاسم بالعربية *" className="rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]"/>
            <input value={newForm.name_en} onChange={e=>setNewForm(f=>({...f,name_en:e.target.value}))} placeholder="الاسم بالإنجليزية" className="rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]" dir="ltr"/>
            <input value={newForm.slug} onChange={e=>setNewForm(f=>({...f,slug:e.target.value}))} placeholder="slug" className="rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]" dir="ltr"/>
            <input type="number" value={newForm.sort_order} onChange={e=>setNewForm(f=>({...f,sort_order:e.target.value}))} placeholder="الترتيب" className="rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]"/>
            <button onClick={createCat} disabled={creating||!newForm.name_ar} className="sm:col-span-2 rounded-xl bg-[#B8860B] py-2 text-sm font-bold text-white disabled:opacity-50">{creating?'...':'إنشاء التصنيف'}</button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading?<p className="p-10 text-center text-sm text-[#A8A29E]">جارٍ التحميل...</p>
        :categories.length===0?<p className="p-10 text-center text-sm text-[#A8A29E]">لا توجد تصنيفات</p>
        :(
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]"><tr>
                {['الاسم (ع)','الاسم (en)','الترتيب','الحالة'].map((h,i)=>(
                  <th key={i} className={`px-5 py-3 text-right text-xs font-black text-[#A8A29E] ${i===1?'hidden sm:table-cell':''} ${i===2?'hidden md:table-cell':''}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {[...categories].sort((a,b)=>(a.sort_order??0)-(b.sort_order??0)).map(c=>(
                  <tr key={c.id} className="group hover:bg-[#FFFBF0] cursor-pointer transition-colors" onClick={()=>open(c)}>
                    <td className="px-5 py-3 font-semibold text-[#1C1917] group-hover:text-[#B8860B] transition-colors">{c.name_ar??''}</td>
                    <td className="px-5 py-3 text-[#A8A29E] hidden sm:table-cell">{c.name_en??''}</td>
                    <td className="px-5 py-3 text-[#57534E] hidden md:table-cell">{c.sort_order??0}</td>
                    <td className="px-5 py-3"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${c.is_active?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-700 border-red-200'}`}>{c.is_active?'نشط':'غير نشط'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected&&(
        <Modal title={selected.name_ar??'قسم'} onClose={()=>setSelected(null)}>
          {msg&&<div className={`mb-4 rounded-xl px-4 py-2 text-sm ${msg.startsWith('✓')?'bg-green-50 text-green-700 border border-green-200':'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}
          {editing?(
            <div className="space-y-3">
              {([['الاسم بالعربية','name_ar',false],['الاسم بالإنجليزية','name_en',true],['Slug','slug',true]] as [string,keyof Category,boolean][]).map(([l,k,ltr])=>(
                <div key={k}><label className="mb-1 block text-xs font-bold text-[#A8A29E]">{l}</label>
                <input value={String(draft[k]??selected[k]??'')} onChange={e=>setDraft(d=>({...d,[k]:e.target.value}))} dir={ltr?'ltr':'rtl'} className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]"/></div>
              ))}
              <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">الترتيب</label><input type="number" value={String(draft.sort_order??selected.sort_order??0)} onChange={e=>setDraft(d=>({...d,sort_order:Number(e.target.value)}))} className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]"/></div>
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
              {([['الاسم (عربي)',selected.name_ar],['الاسم (إنجليزي)',selected.name_en],['Slug',selected.slug],['الترتيب',String(selected.sort_order??0)]] as [string,string|null][]).map(([l,v])=>(
                <div key={l} className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">{l}</span><span className="font-semibold text-[#1C1917]">{v??''}</span></div>
              ))}
              <div className="flex justify-between border-b border-[#F0ECE6] pb-2">
                <span className="text-[#A8A29E]">الحالة</span>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${selected.is_active?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-700 border-red-200'}`}>{selected.is_active?'نشط':'غير نشط'}</span>
              </div>
              <button onClick={()=>{ setDraft({...selected}); setEditing(true); }} className="w-full rounded-xl border border-[#B8860B] py-2 text-sm font-bold text-[#B8860B] hover:bg-[#B8860B]/10">✎ تعديل</button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
