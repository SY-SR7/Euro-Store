'use client';
import { useEffect, useState, useCallback } from 'react';

interface Brand { id: string; name: string; slug: string|null; logo_url?: string|null; is_active: boolean|null; }

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl border border-[#E5E0D8] bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] px-6 py-4">
          <h2 className="font-black text-[#1C1917]">{title}</h2>
          <button onClick={onClose} className="text-xl text-[#A8A29E] hover:text-[#1C1917]">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AdminBrandsPage() {
  const [brands, setBrands]     = useState<Brand[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<Brand|null>(null);
  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState<Partial<Brand>>({});
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState('');
  const [newName, setNewName]   = useState('');
  const [newSlug, setNewSlug]   = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetch('/api/catalog/brands', { cache: 'no-store' }).then(r => r.json()).catch(() => []);
    setBrands(Array.isArray(d) ? d : []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openBrand = (b: Brand) => { setSelected(b); setEditing(false); setDraft({}); setMsg(''); };
  const startEdit = () => { if (selected) { setDraft({ ...selected }); setEditing(true); } };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true); setMsg('');
    const res = await fetch(`/api/catalog/brands/${selected.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    if (res.ok) {
      const updated = { ...selected, ...draft } as Brand;
      setSelected(updated); setBrands(bs => bs.map(b => b.id === selected.id ? updated : b));
      setMsg('✓ تم الحفظ'); setEditing(false);
    } else { setMsg('✗ فشل الحفظ'); }
    setSaving(false);
  };

  const toggleActive = async (b: Brand) => {
    await fetch(`/api/catalog/brands/${b.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !b.is_active }) });
    if (selected?.id === b.id) setSelected({ ...b, is_active: !b.is_active });
    void load();
  };

  const deleteBrand = async (b: Brand) => {
    if (!confirm(`حذف "${b.name}"؟`)) return;
    await fetch(`/api/catalog/brands/${b.id}`, { method: 'DELETE' });
    setSelected(null); void load();
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim()) { setMsg('الاسم والرابط مطلوبان'); return; }
    setCreating(true);
    const res = await fetch('/api/catalog/brands', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName, slug: newSlug.toLowerCase(), is_active: true }) });
    if (res.ok) { setNewName(''); setNewSlug(''); setShowCreate(false); void load(); }
    else { setMsg('✗ فشل الإضافة'); }
    setCreating(false);
  };

  const inp = 'w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]';

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <div><h1 className="text-2xl font-black text-[#1C1917]">العلامات التجارية</h1><p className="mt-1 text-sm text-[#A8A29E]">{brands.length} علامة</p></div>
        <button onClick={() => setShowCreate(v => !v)} className="rounded-xl bg-[#B8860B] px-5 py-2.5 text-sm font-black text-white hover:bg-[#9A7209]">{showCreate ? 'إلغاء' : '+ علامة جديدة'}</button>
      </div>

      {msg && <div className={`rounded-xl px-5 py-3 text-sm ${msg.startsWith('✓') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}

      {showCreate && (
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="اسم العلامة *" className={inp} />
            <input value={newSlug} onChange={e => setNewSlug(e.target.value)} placeholder="الرابط *" className={inp} dir="ltr" />
          </div>
          <button onClick={handleCreate} disabled={creating} className="rounded-xl bg-[#B8860B] px-5 py-2 text-sm font-black text-white disabled:opacity-50">{creating ? '...' : '+ إضافة'}</button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? <p className="p-10 text-center text-sm text-[#A8A29E]">جاري التحميل...</p>
        : brands.length === 0 ? <p className="p-10 text-center text-sm text-[#A8A29E]">لا توجد علامات</p>
        : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]"><tr>
                {['الاسم','الرابط','الحالة'].map((h,i) => <th key={i} className={`px-5 py-3 text-right text-xs font-black text-[#A8A29E] ${i===1?'hidden sm:table-cell':''}`}>{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {brands.map(b => (
                  <tr key={b.id} className="hover:bg-[#FAFAF8] cursor-pointer transition-colors" onClick={() => openBrand(b)}>
                    <td className="px-5 py-3 font-semibold text-[#1C1917]">{b.name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[#A8A29E] hidden sm:table-cell">{b.slug}</td>
                    <td className="px-5 py-3" onClick={e => { e.stopPropagation(); void toggleActive(b); }}>
                      <span className={`cursor-pointer rounded-full px-3 py-1 text-xs font-bold ${b.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>{b.is_active ? 'نشط' : 'معطّل'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          {msg && <div className={`mb-3 rounded-xl px-4 py-2 text-sm ${msg.startsWith('✓') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}
          {!editing ? (
            <div className="space-y-3 text-sm">
              {[['الاسم', selected.name],['Slug', selected.slug]].map(([l,v]) => (
                <div key={l} className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">{l}</span><span className="font-semibold">{v ?? '—'}</span></div>
              ))}
              {selected.logo_url && <div className="border-b border-[#F0ECE6] pb-2"><img src={selected.logo_url} alt={selected.name} className="h-12 object-contain" /></div>}
              <div className="flex justify-between border-b border-[#F0ECE6] pb-2">
                <span className="text-[#A8A29E]">الحالة</span>
                <button onClick={() => void toggleActive(selected)} className={`rounded-full px-3 py-1 text-xs font-bold cursor-pointer ${selected.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                  {selected.is_active ? '✓ نشط' : '✗ معطّل'} — اضغط للتبديل
                </button>
              </div>
              <div className="flex gap-2 pt-3">
                <button onClick={startEdit} className="rounded-xl bg-[#B8860B] px-4 py-2 text-sm font-bold text-white">تعديل</button>
                <button onClick={() => void deleteBrand(selected)} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50">حذف</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {[['name','الاسم'],['slug','Slug'],['logo_url','رابط الشعار (URL)']].map(([k,label]) => (
                <div key={k}><label className="mb-1 block text-xs font-bold text-[#A8A29E]">{label}</label>
                <input value={(draft as Record<string,string|null>)[k] ?? ''} onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))} className={inp} /></div>
              ))}
              <div className="flex gap-2 pt-2">
                <button onClick={saveEdit} disabled={saving} className="rounded-xl bg-[#B8860B] px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{saving ? '...' : 'حفظ'}</button>
                <button onClick={() => setEditing(false)} className="rounded-xl border border-[#E5E0D8] px-5 py-2 text-sm font-bold text-[#57534E]">إلغاء</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}