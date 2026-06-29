'use client';

import { useEffect, useState } from 'react';

interface Category {
  id: string;
  name_ar: string | null;
  name_en: string | null;
  slug: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  // New form
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug]     = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [creating, setCreating]   = useState(false);

  // Edit state
  const [editId, setEditId]         = useState<string | null>(null);
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name_ar: nameAr.trim(), name_en: nameEn.trim() || nameAr.trim(), slug: slug.trim().toLowerCase(), sort_order: parseInt(sortOrder, 10) || 0, is_active: true }),
    });
    if (res.ok) { setNameAr(''); setNameEn(''); setSlug(''); setSortOrder('0'); void load(); }
    else { const p = await res.json().catch(() => null); setError((p as {error?:string}|null)?.error ?? 'فشل الإضافة'); }
    setCreating(false);
  }

  async function handleEditSave(id: string) {
    await fetch(`/api/catalog/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name_ar: editNameAr, name_en: editNameEn }),
    });
    setEditId(null);
    void load();
  }

  async function handleToggle(id: string, current: boolean | null) {
    await fetch(`/api/catalog/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    });
    void load();
  }

  async function handleDelete(id: string) {
    if (!window.confirm('حذف هذا التصنيف؟ تأكد أنه لا يحتوي منتجات.')) return;
    await fetch(`/api/catalog/categories/${id}`, { method: 'DELETE' });
    void load();
  }

  const inp = 'rounded-2xl border border-white/10 bg-[#151515] px-3 py-2 text-sm text-white outline-none focus:border-[#C9A84C]';

  return (
    <div className="space-y-6" dir="rtl">
      <div className="rounded-3xl border border-white/10 bg-[#101010] p-6">
        <h1 className="text-3xl font-black text-white">إدارة التصنيفات</h1>
        <p className="mt-2 text-sm text-[#9CA3AF]">إضافة وتعديل وحذف تصنيفات المتجر.</p>
      </div>

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}

      {/* New category form */}
      <div className="rounded-3xl border border-white/10 bg-[#101010] p-6">
        <h2 className="mb-4 text-lg font-black text-white">تصنيف جديد</h2>
        <form onSubmit={e => void handleCreate(e)} className="flex flex-wrap gap-3 items-end">
          <input value={nameAr} onChange={e => setNameAr(e.target.value)} placeholder="الاسم بالعربية *" className={inp} />
          <input value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="Name in English" className={inp} />
          <input value={slug}   onChange={e => setSlug(e.target.value)}   placeholder="slug-url *" className={inp + ' font-mono'} />
          <input value={sortOrder} onChange={e => setSortOrder(e.target.value)} type="number" placeholder="الترتيب" className={inp + ' w-24'} />
          <button type="submit" disabled={creating} className="rounded-2xl bg-[#C9A84C] px-5 py-2 text-sm font-black text-[#111] hover:bg-[#D8B95F] disabled:opacity-50">
            {creating ? 'جار...' : 'إضافة +'}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#101010] shadow-2xl">
        {loading ? <div className="p-10 text-center text-[#9CA3AF]">جار التحميل...</div> : categories.length === 0 ? (
          <div className="p-10 text-center text-[#9CA3AF]">لا توجد تصنيفات.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-[#C9A84C]">
                <tr>
                  <th className="px-4 py-4 text-right font-black">الاسم بالعربية</th>
                  <th className="px-4 py-4 text-right font-black">الاسم بالإنجليزية</th>
                  <th className="px-4 py-4 text-right font-black">slug</th>
                  <th className="px-4 py-4 text-right font-black">ترتيب</th>
                  <th className="px-4 py-4 text-right font-black">الحالة</th>
                  <th className="px-4 py-4 text-left font-black">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {categories.map(c => (
                  <tr key={c.id} className="text-[#EDE7DD] hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      {editId === c.id
                        ? <input value={editNameAr} onChange={e => setEditNameAr(e.target.value)} className={inp + ' w-full'} />
                        : <span className="font-bold text-white">{c.name_ar ?? '—'}</span>}
                    </td>
                    <td className="px-4 py-3">
                      {editId === c.id
                        ? <input value={editNameEn} onChange={e => setEditNameEn(e.target.value)} className={inp + ' w-full'} />
                        : c.name_en ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#9CA3AF]">{c.slug ?? '—'}</td>
                    <td className="px-4 py-3 text-[#9CA3AF]">{c.sort_order ?? 0}</td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => void handleToggle(c.id, c.is_active)}
                        className={['rounded-full border px-3 py-1 text-xs font-black', c.is_active ? 'border-green-400/20 bg-green-400/10 text-green-200' : 'border-white/10 bg-white/5 text-[#9CA3AF]'].join(' ')}>
                        {c.is_active ? 'مفعّل' : 'موقوف'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-left">
                      {editId === c.id ? (
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => void handleEditSave(c.id)} className="text-xs font-black text-green-300 hover:text-green-200">حفظ</button>
                          <button type="button" onClick={() => setEditId(null)} className="text-xs text-[#9CA3AF] hover:text-white">إلغاء</button>
                        </div>
                      ) : (
                        <div className="flex gap-3 justify-end">
                          <button type="button" onClick={() => { setEditId(c.id); setEditNameAr(c.name_ar ?? ''); setEditNameEn(c.name_en ?? ''); }} className="text-xs font-black text-[#C9A84C] hover:text-[#D8B95F]">تعديل</button>
                          <button type="button" onClick={() => void handleDelete(c.id)} className="text-xs font-black text-red-300 hover:text-red-200">حذف</button>
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