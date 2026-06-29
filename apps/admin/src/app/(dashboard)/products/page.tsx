'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type Product = {
  id: string; name_ar: string; name_en: string;
  slug: string; is_featured: boolean; is_active: boolean;
  category_id?: string|null; brand_id?: string|null; created_at: string;
};
type Category = { id: string; name_ar: string };
type Brand    = { id: string; name: string };

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl border border-[#E5E0D8] bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] px-6 py-4">
          <h2 className="font-black text-[#1C1917]">{title}</h2>
          <button onClick={onClose} className="text-[#A8A29E] hover:text-[#1C1917] text-xl">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts]     = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands]         = useState<Brand[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState<'all'|'active'|'inactive'|'featured'>('all');
  const [selected, setSelected]     = useState<Product|null>(null);
  const [editing, setEditing]       = useState(false);
  const [editDraft, setEditDraft]   = useState<Partial<Product>>({});
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/catalog/products').then(r => r.json()).catch(() => []),
      fetch('/api/catalog/categories').then(r => r.json()).catch(() => []),
      fetch('/api/catalog/brands').then(r => r.json()).catch(() => []),
    ]).then(([prods, cats, brs]) => {
      setProducts(Array.isArray(prods) ? prods : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setBrands(Array.isArray(brs) ? brs : []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = products.filter(p => {
    const q = search.toLowerCase();
    const m = !q || p.name_ar?.toLowerCase().includes(q) || p.name_en?.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q);
    const f = filter === 'all' ? true : filter === 'active' ? p.is_active : filter === 'inactive' ? !p.is_active : p.is_featured;
    return m && f;
  });

  const openProduct = (p: Product) => { setSelected(p); setEditing(false); setEditDraft({}); setMsg(''); };
  const startEdit = () => { if (!selected) return; setEditDraft({ ...selected }); setEditing(true); };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true); setMsg('');
    const res = await fetch(`/api/catalog/products/${selected.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editDraft),
    });
    if (res.ok) {
      setMsg('✓ تم الحفظ');
      const updated = { ...selected, ...editDraft } as Product;
      setSelected(updated);
      setProducts(ps => ps.map(p => p.id === selected.id ? updated : p));
      setEditing(false);
    } else {
      const d = await res.json().catch(() => null);
      setMsg('✗ ' + ((d as {error?:string}|null)?.error ?? 'فشل'));
    }
    setSaving(false);
  };

  const toggleActive = async (p: Product) => {
    await fetch(`/api/catalog/products/${p.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !p.is_active }),
    });
    if (selected?.id === p.id) setSelected({ ...selected, is_active: !p.is_active });
    load();
  };

  const toggleFeatured = async (p: Product) => {
    await fetch(`/api/catalog/products/${p.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_featured: !p.is_featured }),
    });
    if (selected?.id === p.id) setSelected({ ...selected, is_featured: !p.is_featured });
    load();
  };

  const deleteProduct = async (p: Product) => {
    if (!confirm(`حذف "${p.name_ar}"؟`)) return;
    await fetch(`/api/catalog/products/${p.id}`, { method: 'DELETE' });
    setSelected(null);
    load();
  };

  const catName = (id?: string|null) => categories.find(c => c.id === id)?.name_ar ?? '—';
  const brName  = (id?: string|null) => brands.find(b => b.id === id)?.name ?? '—';

  const inputCls = 'w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]';

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1C1917]">إدارة المنتجات</h1>
          <p className="mt-1 text-sm text-[#A8A29E]">{products.length} منتج إجمالاً</p>
        </div>
        <Link href="/products/new" className="inline-flex items-center gap-2 rounded-xl bg-[#B8860B] px-5 py-2.5 text-sm font-black text-white hover:bg-[#9A7209] transition-colors whitespace-nowrap">
          + منتج جديد
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className={inputCls + ' flex-1'} />
        <div className="flex flex-wrap gap-2">
          {(['all','active','inactive','featured'] as const).map(k => (
            <button key={k} onClick={() => setFilter(k)}
              className={['rounded-lg px-3 py-1.5 text-xs font-bold border transition-colors', filter === k ? 'bg-[#B8860B] text-white border-[#B8860B]' : 'border-[#E5E0D8] text-[#57534E] hover:border-[#B8860B]'].join(' ')}>
              {k==='all'?'الكل':k==='active'?'مفعّل':k==='inactive'?'معطّل':'مميز'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? <p className="p-10 text-center text-sm text-[#A8A29E]">جاري التحميل...</p>
        : visible.length === 0 ? <p className="p-10 text-center text-sm text-[#A8A29E]">لا توجد منتجات</p>
        : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]">
                <tr>
                  {['الاسم','الحالة','مميز','التصنيف','إجراء'].map((h,i) => (
                    <th key={i} className={`px-5 py-3 text-right text-xs font-black text-[#A8A29E] ${i===3?'hidden md:table-cell':''} ${i===4?'text-left':''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {visible.map(p => (
                  <tr key={p.id} className="hover:bg-[#FAFAF8] cursor-pointer transition-colors" onClick={() => openProduct(p)}>
                    <td className="px-5 py-3 font-bold text-[#1C1917]">{p.name_ar}</td>
                    <td className="px-5 py-3" onClick={e => { e.stopPropagation(); void toggleActive(p); }}>
                      <span className={`cursor-pointer rounded-full px-3 py-1 text-xs font-bold ${p.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                        {p.is_active ? 'نشط' : 'معطّل'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center" onClick={e => { e.stopPropagation(); void toggleFeatured(p); }}>
                      <button className="text-lg">{p.is_featured ? '⭐' : '☆'}</button>
                    </td>
                    <td className="px-5 py-3 text-xs text-[#57534E] hidden md:table-cell">{catName(p.category_id)}</td>
                    <td className="px-5 py-3 text-left">
                      <Link href={`/products/${p.id}`} onClick={e => e.stopPropagation()} className="font-bold text-[#B8860B] hover:underline text-xs">هاب</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <Modal title={selected.name_ar} onClose={() => setSelected(null)}>
          {msg && <div className={`mb-3 rounded-xl px-4 py-2 text-sm ${msg.startsWith('✓') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}
          {!editing ? (
            <div className="space-y-3 text-sm">
              {[
                ['الاسم بالعربية', selected.name_ar],
                ['الاسم بالإنجليزية', selected.name_en],
                ['Slug', selected.slug],
                ['التصنيف', catName(selected.category_id)],
                ['الماركة', brName(selected.brand_id)],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between border-b border-[#F0ECE6] pb-2">
                  <span className="text-[#A8A29E]">{label}</span>
                  <span className="font-semibold text-[#1C1917]">{val}</span>
                </div>
              ))}
              <div className="flex justify-between border-b border-[#F0ECE6] pb-2">
                <span className="text-[#A8A29E]">الحالة</span>
                <button onClick={() => void toggleActive(selected)} className={`rounded-full px-3 py-1 text-xs font-bold cursor-pointer ${selected.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                  {selected.is_active ? '✓ نشط — اضغط لتعطيل' : '✗ معطّل — اضغط لتفعيل'}
                </button>
              </div>
              <div className="flex justify-between border-b border-[#F0ECE6] pb-2">
                <span className="text-[#A8A29E]">مميّز</span>
                <button onClick={() => void toggleFeatured(selected)} className="text-lg">{selected.is_featured ? '⭐ نعم' : '☆ لا'}</button>
              </div>
              <div className="flex flex-wrap gap-2 pt-3">
                <button onClick={startEdit} className="rounded-xl bg-[#B8860B] px-4 py-2 text-sm font-bold text-white hover:bg-[#9A7209]">تعديل</button>
                <Link href={`/products/${selected.id}`} className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-bold text-[#1C1917] hover:border-[#B8860B]">هاب المنتج</Link>
                <Link href={`/products/${selected.id}/variants`} className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-bold text-[#1C1917] hover:border-[#B8860B]">المتغيرات</Link>
                <Link href={`/products/${selected.id}/images`} className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-bold text-[#1C1917] hover:border-[#B8860B]">الصور</Link>
                <button onClick={() => void deleteProduct(selected)} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50">حذف</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {[['name_ar','الاسم بالعربية'],['name_en','الاسم بالإنجليزية'],['slug','Slug']].map(([k,label]) => (
                <div key={k}>
                  <label className="mb-1 block text-xs font-bold text-[#A8A29E]">{label}</label>
                  <input value={(editDraft as Record<string,string>)[k] ?? ''} onChange={e => setEditDraft(d => ({ ...d, [k]: e.target.value }))} className={inputCls} />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-xs font-bold text-[#A8A29E]">التصنيف</label>
                <select value={editDraft.category_id ?? ''} onChange={e => setEditDraft(d => ({ ...d, category_id: e.target.value || null }))} className={inputCls}>
                  <option value="">— بدون تصنيف —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#A8A29E]">الماركة</label>
                <select value={editDraft.brand_id ?? ''} onChange={e => setEditDraft(d => ({ ...d, brand_id: e.target.value || null }))} className={inputCls}>
                  <option value="">— بدون ماركة —</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                  <input type="checkbox" checked={editDraft.is_active ?? false} onChange={e => setEditDraft(d => ({ ...d, is_active: e.target.checked }))} className="h-4 w-4 accent-[#B8860B]" />
                  نشط
                </label>
                <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                  <input type="checkbox" checked={editDraft.is_featured ?? false} onChange={e => setEditDraft(d => ({ ...d, is_featured: e.target.checked }))} className="h-4 w-4 accent-[#B8860B]" />
                  مميّز
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={saveEdit} disabled={saving} className="rounded-xl bg-[#B8860B] px-5 py-2 text-sm font-bold text-white hover:bg-[#9A7209] disabled:opacity-50">{saving ? '...' : 'حفظ'}</button>
                <button onClick={() => setEditing(false)} className="rounded-xl border border-[#E5E0D8] px-5 py-2 text-sm font-bold text-[#57534E]">إلغاء</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}