'use client';
import { useEffect, useState, useCallback } from 'react';

interface Category {
  id: string; name_ar: string|null; name_en: string|null;
  slug: string|null; sort_order: number|null; is_active: boolean|null; image_url?: string|null;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl border border-[#E5E0D8] bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] px-6 py-4">
          <h2 className="font-black text-[#1C1917]">{title}</h2>
          <button onClick={onClose} className="text-[#A8A29E] hover:text-[#1C1917] text-xl">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<Category|null>(null);
  const [editing, setEditing]       = useState(false);
  const [draft, setDraft]           = useState<Partial<Category>>({});
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState('');
  const [newForm, setNewForm]       = useState({ name_ar:'', name_en:'', slug:'', sort_order:'0' });
  const [creating, setCreating]     = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/catalog/categories', { cache: 'no-store' });
    const d = await res.json().catch(() => []);
    setCategories(Array.isArray(d) ? d : []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openCat = (c: Category) => { setSelected(c); setEditing(false); setDraft({}); setMsg(''); };

  const startEdit = () => { if (selected) { setDraft({ ...selected }); setEditing(true); } };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true); setMsg('');
    const res = await fetch(`/api/catalog/categories/${selected.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...draft,
        sort_order: draft.sort_order != null ? Number(draft.sort_order) : undefined,
      }),
    });
    if (res.ok) {
      const updated = { ...selected, ...draft } as Category;
      setSelected(updated);
      setCategories(cs => cs.map(c => c.id === selected.id ? updated : c));
      setMsg('✓ تم الحفظ'); setEditing(false);
    } else {
      const d = await res.json().catch(() => null);
      setMsg('✗ ' + ((d as {error?:string}|null)?.error ?? 'فشل'));
    }
    setSaving(false);
  };

  const toggleActive = async (c: Category) => {
    await fetch(`/api/catalog/categories/${c.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !c.is_active }),
    });
    if (selected?.id === c.id) setSelected({ ...c, is_active: !c.is_active });
    void load();
  };

  const deleteCat = async (c: Category) => {
    if (!confirm(`حذف "${c.name_ar}"؟`)) return;
    await fetch(`/api/catalog/categories/${c.id}`, { method: 'DELETE' });
    setSelected(null); void load();
  };

  const handleCreate = async () => {
    if (!newForm.name_ar.trim() || !newForm.slug.trim()) { setMsg('الاسم والرابط مطلوبان'); return; }
    setCreating(true); setMsg('');
    const res = await fetch('/api/catalog/categories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name_ar: newForm.name_ar, name_en: newForm.name_en || newForm.name_ar, slug: newForm.slug.toLowerCase(), sort_order: Number(newForm.sort_order) || 0, is_active: true }),
    });
    if (res.ok) { setNewForm({ name_ar:'', name_en:'', slug:'', sort_order:'0' }); setShowCreate(false); void load(); }
    else { const d = await res.json().catch(() => null); setMsg('✗ ' + ((d as {error?:string}|null)?.error ?? 'فشل')); }
    setCreating(false);
  };

  const inp = 'w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]';

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-[#1C1917]">التصنيفات</h1>
          <p className="mt-1 text-sm text-[#A8A29E]">{categories.length} تصنيف</p>
        </div>
        <button onClick={() => setShowCreate(v => !v)} className="rounded-xl bg-[#B8860B] px-5 py-2.5 text-sm font-black text-white hover:bg-[#9A7209]">
          {showCreate ? 'إلغاء' : '+ تصنيف جديد'}
        </button>
      </div>

      {msg && <div className={`rounded-xl px-5 py-3 text-sm ${msg.startsWith('✓') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}

      {showCreate && (
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm space-y-3">
          <h2 className="font-black text-[#B8860B]">إضافة تصنيف</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={newForm.name_ar} onChange={e => setNewForm(f=>({...f,name_ar:e.target.value}))} placeholder="الاسم بالعربية *" className={inp} />
            <input value={newForm.name_en} onChange={e => setNewForm(f=>({...f,name_en:e.target.value}))} placeholder="الاسم بالإنجليزية" className={inp} />
            <input value={newForm.slug} onChange={e => setNewForm(f=>({...f,slug:e.target.value}))} placeholder="الرابط (slug) *" className={inp} dir="ltr" />
            <input value={newForm.sort_order} onChange={e => setNewForm(f=>({...f,sort_order:e.target.value}))} placeholder="الترتيب (0)" type="number" className={inp} />
          </div>
          <button onClick={handleCreate} disabled={creating} className="rounded-xl bg-[#B8860B] px-5 py-2 text-sm font-black text-white disabled:opacity-50">
            {creating ? '...' : '+ إضافة'}
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? <p className="p-10 text-center text-sm text-[#A8A29E]">جاري التحميل...</p>
        : categories.length === 0 ? <p className="p-10 text-center text-sm text-[#A8A29E]">لا توجد تصنيفات</p>
        : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]">
                <tr>
                  {['الاسم','الرابط','الترتيب','الحالة'].map((h,i) => (
                    <th key={i} className={`px-5 py-3 text-right text-xs font-black text-[#A8A29E] ${i===1?'hidden sm:table-cell':''} ${i===2?'hidden md:table-cell':''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {categories.map(c => (
                  <tr key={c.id} className="hover:bg-[#FAFAF8] cursor-pointer transition-colors" onClick={() => openCat(c)}>
                    <td className="px-5 py-3 font-semibold text-[#1C1917]">{c.name_ar}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[#A8A29E] hidden sm:table-cell">{c.slug}</td>
                    <td className="px-5 py-3 text-xs text-[#57534E] hidden md:table-cell">{c.sort_order ?? 0}</td>
                    <td className="px-5 py-3" onClick={e => { e.stopPropagation(); void toggleActive(c); }}>
                      <span className={`cursor-pointer rounded-full px-3 py-1 text-xs font-bold ${c.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                        {c.is_active ? 'نشط' : 'معطّل'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <Modal title={selected.name_ar ?? 'تصنيف'} onClose={() => setSelected(null)}>
          {msg && <div className={`mb-3 rounded-xl px-4 py-2 text-sm ${msg.startsWith('✓') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}
          {!editing ? (
            <div className="space-y-3 text-sm">
              {[['الاسم بالعربية', selected.name_ar],['الاسم بالإنجليزية', selected.name_en],['Slug', selected.slug],['الترتيب', String(selected.sort_order ?? 0)]].map(([l,v]) => (
                <div key={l} className="flex justify-between border-b border-[#F0ECE6] pb-2">
                  <span className="text-[#A8A29E]">{l}</span><span className="font-semibold text-[#1C1917]">{v ?? '—'}</span>
                </div>
              ))}
              <div className="flex justify-between border-b border-[#F0ECE6] pb-2">
                <span className="text-[#A8A29E]">الحالة</span>
                <button onClick={() => void toggleActive(selected)} className={`rounded-full px-3 py-1 text-xs font-bold cursor-pointer ${selected.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                  {selected.is_active ? '✓ نشط' : '✗ معطّل'} — اضغط للتبديل
                </button>
              </div>
              <div className="flex gap-2 pt-3">
                <button onClick={startEdit} className="rounded-xl bg-[#B8860B] px-4 py-2 text-sm font-bold text-white">تعديل</button>
                <button onClick={() => void deleteCat(selected)} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50">حذف</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {[['name_ar','الاسم بالعربية'],['name_en','الاسم بالإنجليزية'],['slug','Slug']].map(([k,label]) => (
                <div key={k}>
                  <label className="mb-1 block text-xs font-bold text-[#A8A29E]">{label}</label>
                  <input value={(draft as Record<string,string|null>)[k] ?? ''} onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))} className={inp} />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-xs font-bold text-[#A8A29E]">الترتيب</label>
                <input type="number" value={draft.sort_order ?? 0} onChange={e => setDraft(d => ({ ...d, sort_order: Number(e.target.value) }))} className={inp} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#A8A29E]">رابط الصورة (URL)</label>
                <input value={draft.image_url ?? ''} onChange={e => setDraft(d => ({ ...d, image_url: e.target.value }))} className={inp} placeholder="https://..." />
              </div>
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