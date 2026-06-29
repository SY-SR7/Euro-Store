'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Category { id: string; name_ar: string; name_en: string }
interface Brand    { id: string; name: string }
interface Product  {
  id: string; name_ar: string; name_en: string; slug: string;
  description_ar: string; description_en: string;
  is_featured: boolean; is_active: boolean;
  category_id: string | null; brand_id: string | null;
}

export function EditProductForm({ product, categories, brands }: { product: Product; categories: Category[]; brands: Brand[] }) {
  const router = useRouter();
  const [saving,  setSaving]  = useState(false);
  const [deleting,setDeleting]= useState(false);
  const [error,   setError]   = useState('');
  const [msg,     setMsg]     = useState('');

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true); setError(''); setMsg('');
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      name_ar:        fd.get('name_ar'),
      name_en:        fd.get('name_en'),
      slug:           fd.get('slug'),
      description_ar: fd.get('description_ar'),
      description_en: fd.get('description_en'),
      is_featured:    fd.get('is_featured') === 'on',
      is_active:      fd.get('is_active')   === 'on',
      category_id:    fd.get('category_id') || null,
      brand_id:       fd.get('brand_id')    || null,
    };
    const res = await fetch(`/api/catalog/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) { setMsg('تم الحفظ بنجاح ✓'); router.refresh(); }
    else        { setError('فشل الحفظ'); }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm('هل تريد حذف هذا المنتج نهائياً؟')) return;
    setDeleting(true);
    const res = await fetch(`/api/catalog/products/${product.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/products');
    else { setError('فشل الحذف'); setDeleting(false); }
  }

  const inputCls = 'w-full rounded-xl border border-[#E8DCC3] bg-[#FFFDF8] px-4 py-3 text-sm text-[#1F1B16] outline-none focus:border-[#C9A84C] transition-colors';
  const labelCls = 'flex flex-col gap-2 text-sm';
  const spanCls  = 'text-[#6F6658] font-medium';

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between rounded-3xl border border-[#E8DCC3] bg-[#FFFDF8] p-6">
        <div>
          <Link href={`/products/${product.id}`} className="text-xs text-[#6F6658] hover:text-[#C9A84C] transition-colors">
            ← {product.name_ar}
          </Link>
          <h1 className="mt-1 text-2xl font-black text-[#1F1B16]">تعديل المنتج</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/products/${product.id}/variants`} className="rounded-2xl border border-[#E8DCC3] px-4 py-2 text-xs font-bold text-[#1F1B16] hover:border-[#C9A84C] transition-colors">المتغيرات</Link>
          <Link href={`/products/${product.id}/images`}   className="rounded-2xl border border-[#C9A84C]/30 px-4 py-2 text-xs font-bold text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors">الصور</Link>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

          {/* Main */}
          <div className="space-y-4 rounded-3xl border border-[#E8DCC3] bg-[#FFFDF8] p-6">
            <h2 className="text-base font-black text-[#C9A84C]">المعلومات الأساسية</h2>

            {error && <p className="rounded-xl border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">{error}</p>}
            {msg   && <p className="rounded-xl border border-green-800 bg-green-900/20 p-3 text-sm text-green-400">{msg}</p>}

            <label className={labelCls}>
              <span className={spanCls}>اسم المنتج بالعربية *</span>
              <input name="name_ar" required defaultValue={product.name_ar} className={inputCls} />
            </label>

            <label className={labelCls}>
              <span className={spanCls}>اسم المنتج بالإنجليزية *</span>
              <input name="name_en" required defaultValue={product.name_en} className={inputCls} />
            </label>

            <label className={labelCls}>
              <span className={spanCls}>الرابط (Slug) *</span>
              <input name="slug" required pattern="[a-z0-9-]+" defaultValue={product.slug} className={`${inputCls} font-mono`} />
            </label>

            <label className={labelCls}>
              <span className={spanCls}>الوصف بالعربية</span>
              <textarea name="description_ar" rows={4} defaultValue={product.description_ar} className={inputCls} />
            </label>

            <label className={labelCls}>
              <span className={spanCls}>الوصف بالإنجليزية</span>
              <textarea name="description_en" rows={4} defaultValue={product.description_en} className={inputCls} />
            </label>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            <div className="space-y-4 rounded-3xl border border-[#E8DCC3] bg-[#FFFDF8] p-6">
              <h2 className="text-base font-black text-[#C9A84C]">التصنيف والعلامة</h2>

              <label className={labelCls}>
                <span className={spanCls}>التصنيف</span>
                <select name="category_id" defaultValue={product.category_id ?? ''} className={inputCls}>
                  <option value="">-- اختر التصنيف --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
                </select>
              </label>

              <label className={labelCls}>
                <span className={spanCls}>العلامة التجارية</span>
                <select name="brand_id" defaultValue={product.brand_id ?? ''} className={inputCls}>
                  <option value="">-- اختر العلامة --</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>
            </div>

            <div className="space-y-3 rounded-3xl border border-[#E8DCC3] bg-[#FFFDF8] p-6">
              <h2 className="text-base font-black text-[#C9A84C]">الخيارات</h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="is_active" defaultChecked={product.is_active} className="accent-[#C9A84C] w-4 h-4" />
                <span className="text-sm text-[#1F1B16]">منتج مفعّل</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="is_featured" defaultChecked={product.is_featured} className="accent-[#C9A84C] w-4 h-4" />
                <span className="text-sm text-[#1F1B16]">منتج مميز</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="flex-1 rounded-2xl bg-[#C9A84C] px-6 py-3 text-sm font-black text-[#111] hover:bg-[#D8B95F] transition-colors disabled:opacity-50">
                {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
            </div>

            <button type="button" onClick={handleDelete} disabled={deleting}
              className="w-full rounded-2xl border border-red-900 bg-red-900/10 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-50">
              {deleting ? 'جاري الحذف...' : 'حذف المنتج'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}