'use client';
import { useEffect, useState } from 'react';

interface Category {
  id: string; name_ar: string|null; name_en: string|null;
  slug: string|null; sort_order: number|null; is_active: boolean|null;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [nameAr, setNameAr]         = useState('');
  const [nameEn, setNameEn]         = useState('');
  const [slug, setSlug]             = useState('');
  const [creating, setCreating]     = useState(false);
  const [editId, setEditId]         = useState<string|null>(null);
  const [editNameAr, setEditNameAr] = useState('');
  const [editNameEn, setEditNameEn] = useState('');

  async function load() {
    setLoading(true); setError('');
    const res = await fetch('/api/catalog/categories', { cache: 'no-store' });
    const d = await res.json().catch(() => []);
    setCategories(Array.isArray(d) ? d : []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!nameAr.trim() || !slug.trim()) { setError('الاسم بالعربية والرابط مطلوبان'); return; }
    setError(''); setCreating(true);
    const res = await fetch('/api/catalog/categories', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name_ar:nameAr.trim(), name_en:nameEn.trim()||nameAr.trim(), slug:slug.trim().toLowerCase(), sort_order:0, is_active:true }),
    });
    if (res.ok) { setNameAr(''); setNameEn(''); setSlug(''); void load(); }
    else { const p = await res.json().catch(()=>null); setError((p as {error?:string}|null)?.error ?? 'فشل الإضافة'); }
    setCreating(false);
  }

  async function handleEditSave(id: string) {
    await fetch(`/api/catalog/categories/${id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name_ar:editNameAr, name_en:editNameEn }),
    });
    setEditId(null); void load();
  }

  async function handleToggle(id: string, current: boolean|null) {
    await fetch(`/api/catalog/categories/${id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ is_active: !current }),
    });
    void load();
  }

  async function handleDelete(id: string) {
    if (!confirm('حذف هذا التصنيف؟')) return;
    await fetch(`/api/catalog/categories/${id}`, { method:'DELETE' });
    void load();
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-black text-[#1C1917]">التصنيفات</h1>
        <p className="mt-1 text-sm text-[#A8A29E]">{categories.length} تصنيف</p>
      </div>

      <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-black text-[#B8860B]">إضافة تصنيف جديد</h2>
        {error && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-3">
          <input value={nameAr} onChange={e=>setNameAr(e.target.value)} placeholder="الاسم بالعربية *" className="input-field" />
          <input value={nameEn} onChange={e=>setNameEn(e.target.value)} placeholder="الاسم بالإنجليزية" className="input-field" />
          <input value={slug} onChange={e=>setSlug(e.target.value)} placeholder="الرابط (en-slug) *" className="input-field" dir="ltr" />
          <button type="submit" disabled={creating} className="rounded-xl bg-[#B8860B] px-5 py-2.5 text-sm font-black text-[#1F1B16] hover:bg-[#9A7209] disabled:opacity-50 transition-colors sm:col-span-3 w-fit">
            {creating ? 'جاري الإضافة...' : '+ إضافة'}
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? <p className="p-10 text-center text-sm text-[#A8A29E]">جاري التحميل...</p>
        : categories.length === 0 ? <p className="p-10 text-center text-sm text-[#A8A29E]">لا توجد تصنيفات</p>
        : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]">
                <tr>
                  {['الاسم (عربي)','الاسم (إنجليزي)','الرابط','الحالة','الإجراءات'].map((h,i) => (
                    <th key={i} className={`px-5 py-3 text-right text-xs font-black text-[#A8A29E] ${i===1?'hidden sm:table-cell':''} ${i===2?'hidden md:table-cell':''} ${i===4?'text-left':''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="px-5 py-3">
                      {editId === cat.id ? (
                        <input value={editNameAr} onChange={e=>setEditNameAr(e.target.value)} className="input-field" />
                      ) : (
                        <span className="font-semibold text-[#1C1917]">{cat.name_ar ?? '—'}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[#57534E] hidden sm:table-cell">
                      {editId === cat.id ? (
                        <input value={editNameEn} onChange={e=>setEditNameEn(e.target.value)} className="input-field" dir="ltr" />
                      ) : (cat.name_en ?? '—')}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-[#A8A29E] hidden md:table-cell">{cat.slug ?? '—'}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => void handleToggle(cat.id, cat.is_active)} className="transition-opacity hover:opacity-70">
                        <span className={cat.is_active ? 'badge-green' : 'badge-gray'}>{cat.is_active ? 'نشط' : 'معطّل'}</span>
                      </button>
                    </td>
                    <td className="px-5 py-3 text-left">
                      {editId === cat.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => void handleEditSave(cat.id)} className="font-bold text-green-600 hover:underline text-xs">حفظ</button>
                          <button onClick={() => setEditId(null)} className="font-bold text-[#A8A29E] hover:underline text-xs">إلغاء</button>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <button onClick={() => { setEditId(cat.id); setEditNameAr(cat.name_ar??''); setEditNameEn(cat.name_en??''); }} className="font-bold text-[#B8860B] hover:underline text-xs">تعديل</button>
                          <button onClick={() => void handleDelete(cat.id)} className="font-bold text-red-500 hover:underline text-xs">حذف</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}