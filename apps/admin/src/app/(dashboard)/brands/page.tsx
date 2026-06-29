'use client';
import { useEffect, useState, useCallback } from 'react';

interface Brand { id: string; name: string; slug: string|null; logo_url?: string|null; is_active: boolean|null; }

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

export default function AdminBrandsPage() {
  const [brands,setBrands]    = useState<Brand[]>([]);
  const [loading,setLoading]  = useState(true);
  const [selected,setSelected]= useState<Brand|null>(null);
  const [editing,setEditing]  = useState(false);
  const [draft,setDraft]      = useState<Partial<Brand>>({});
  const [saving,setSaving]    = useState(false);
  const [msg,setMsg]          = useState('');
  const [newName,setNewName]  = useState('');
  const [newSlug,setNewSlug]  = useState('');
  const [creating,setCreating]= useState(false);
  const [showCreate,setShowCreate] = useState(false);
  const [search,setSearch]    = useState('');

  const load = useCallback(async()=>{
    setLoading(true);
    const d = await fetch('/api/catalog/brands',{cache:'no-store'}).then(r=>r.json()).catch(()=>[]);
    setBrands(Array.isArray(d)?d:[]); setLoading(false);
  },[]);
  useEffect(()=>{ void load(); },[load]);

  const open = (b:Brand) => { setSelected(b); setEditing(false); setDraft({}); setMsg(''); };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true); setMsg('');
    const res = await fetch(`/api/catalog/brands/${selected.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(draft)});
    if (res.ok) {
      const u={...selected,...draft} as Brand;
      setSelected(u); setBrands(bs=>bs.map(b=>b.id===selected.id?u:b));
      setMsg('? ?? ?????'); setEditing(false);
    } else setMsg('? ??? ?????');
    setSaving(false);
  };

  const toggleActive = async (b:Brand) => {
    await fetch(`/api/catalog/brands/${b.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({is_active:!b.is_active})});
    if (selected?.id===b.id) setSelected({...b,is_active:!b.is_active});
    void load();
  };

  const createBrand = async () => {
    if (!newName) return;
    setCreating(true);
    const res = await fetch('/api/catalog/brands',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:newName,slug:newSlug||newName.toLowerCase().replace(/\s+/g,'-')})});
    if (res.ok) { setNewName(''); setNewSlug(''); setShowCreate(false); void load(); }
    setCreating(false);
  };

  const visible = brands.filter(b=>!search||b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-black text-[#1C1917]">???????? ????????</h1><p className="mt-1 text-sm text-[#A8A29E]">{brands.length} ?????</p></div>
        <button onClick={()=>setShowCreate(v=>!v)} className="rounded-xl bg-[#B8860B] px-5 py-2.5 text-sm font-black text-[#1F1B16] hover:bg-[#9A7209] transition-colors">{showCreate?'?????':'+ ????? ?????'}</button>
      </div>

      {showCreate&&(
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-black text-[#B8860B]">????? ????? ?????? ?????</h2>
          <div className="flex gap-3 flex-col sm:flex-row">
            <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="????? *" className="flex-1 rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]"/>
            <input value={newSlug} onChange={e=>setNewSlug(e.target.value)} placeholder="??? slug (???????)" className="flex-1 rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]" dir="ltr"/>
            <button onClick={createBrand} disabled={creating||!newName} className="rounded-xl bg-[#B8860B] px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{creating?'...':'?????'}</button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="???..." className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]"/>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading?<p className="p-10 text-center text-sm text-[#A8A29E]">???? ???????...</p>
        :visible.length===0?<p className="p-10 text-center text-sm text-[#A8A29E]">?? ???? ??????</p>
        :(
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]"><tr>
                {['?????','Slug','??????'].map((h,i)=><th key={i} className={`px-5 py-3 text-right text-xs font-black text-[#A8A29E] ${i===1?'hidden sm:table-cell':''}`}>{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {visible.map(b=>(
                  <tr key={b.id} className="group hover:bg-[#FFFBF0] cursor-pointer transition-colors" onClick={()=>open(b)}>
                    <td className="px-5 py-3 font-semibold text-[#1C1917] group-hover:text-[#B8860B] transition-colors">{b.name}</td>
                    <td className="px-5 py-3 text-xs text-[#A8A29E] hidden sm:table-cell font-mono">{b.slug??'—'}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${b.is_active?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-700 border-red-200'}`}>
                        {b.is_active?'???':'??? ???'}
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
        <Modal title={selected.name} onClose={()=>setSelected(null)}>
          {msg&&<div className={`mb-4 rounded-xl px-4 py-2 text-sm ${msg.startsWith('?')?'bg-green-50 text-green-700 border border-green-200':'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}
          {editing?(
            <div className="space-y-3">
              <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">?????</label><input value={draft.name??selected.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))} className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]"/></div>
              <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">Slug</label><input value={draft.slug??selected.slug??''} onChange={e=>setDraft(d=>({...d,slug:e.target.value}))} className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]" dir="ltr"/></div>
              <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">???? ?????? (URL)</label><input value={draft.logo_url??selected.logo_url??''} onChange={e=>setDraft(d=>({...d,logo_url:e.target.value}))} className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]" dir="ltr"/></div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-[#57534E]">???</label>
                <button onClick={()=>setDraft(d=>({...d,is_active:!(d.is_active??selected.is_active)}))} className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${(draft.is_active??selected.is_active)?'bg-[#B8860B]':'bg-gray-300'}`}>
                  <span className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${(draft.is_active??selected.is_active)?'translate-x-[-1.375rem]':'translate-x-[-0.125rem]'}`}/>
                </button>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={saveEdit} disabled={saving} className="flex-1 rounded-xl bg-[#B8860B] py-2 text-sm font-bold text-white hover:bg-[#9A7209] disabled:opacity-50">{saving?'...':'???'}</button>
                <button onClick={()=>setEditing(false)} className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#57534E]">?????</button>
              </div>
            </div>
          ):(
            <div className="space-y-3 text-sm">
              {([['?????',selected.name],['Slug',selected.slug],['??????',selected.logo_url]] as [string,string|null|undefined][]).map(([l,v])=>(
                <div key={l} className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">{l}</span><span className="font-semibold text-[#1C1917] truncate max-w-[60%]">{v??'—'}</span></div>
              ))}
              <div className="flex justify-between border-b border-[#F0ECE6] pb-2">
                <span className="text-[#A8A29E]">??????</span>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${selected.is_active?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-700 border-red-200'}`}>{selected.is_active?'???':'??? ???'}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={()=>{ setDraft({...selected}); setEditing(true); }} className="flex-1 rounded-xl border border-[#B8860B] py-2 text-sm font-bold text-[#B8860B] hover:bg-[#B8860B]/10">? ?????</button>
                <button onClick={()=>void toggleActive(selected)} className={`rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${selected.is_active?'border-red-300 text-red-600 hover:bg-red-50':'border-green-300 text-green-600 hover:bg-green-50'}`}>{selected.is_active?'?????':'?????'}</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
