'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Category { id: string; name_ar: string; name_en: string }
interface Brand    { id: string; name: string }

export default function NewProductPage() {
  const router = useRouter();
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands,     setBrands]     = useState<Brand[]>([]);

  useEffect(() => {
    fetch('/api/catalog/categories').then(r => r.json()).then(d => setCategories(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/catalog/brands').then(r => r.json()).then(d => setBrands(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true); setError('');
    const form = e.currentTarget;
    const fd = new FormData(form);
    const body: Record<string, unknown> = {
      name_ar:        fd.get('name_ar'),
      name_en:        fd.get('name_en'),
      slug:           fd.get('slug'),
      description_ar: fd.get('description_ar'),
      description_en: fd.get('description_en'),
      is_featured:    fd.get('is_featured') === 'on',
      is_active:      fd.get('is_active')   === 'on',
    };
    const catId = fd.get('category_id'); if (catId) body.category_id = catId;
    const brdId = fd.get('brand_id');    if (brdId) body.brand_id    = brdId;

    const res = await fetch('/api/catalog/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json() as { id?: string };
      router.push(data.id ? `/products/${data.id}` : '/products');
    } else {
      setError('فشل حفظ المنتج');
      setSaving(false);
    }
  }

  const inputCls = 'w-full rounded-xl border border-[#E8DCC3] bg-[#FFFDF8] px-4 py-3 text-sm text-[#1F1B16] outline-none focus:border-[#C9A84C] transition-colors';
  const labelCls = 'flex flex-col gap-2 text-sm';
  const spanCls  = 'text-[#6F6658] font-medium';

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between rounded-3xl border border-[#E8DCC3] bg-[#FFFDF8] p-6">
        <div>
          <Link href="/products" className="text-xs text-[#6F6658] hover:text-[#C9A84C] transition-colors">
            ← المنتجات
          </Link>
          <h1 className="mt-1 text-2xl font-black text-[#1F1B16]">منتج جديد</h1>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

          {/* Main column */}
          <div className="space-y-4 rounded-3xl border border-[#E8DCC3] bg-[#FFFDF8] p-6">
            <h2 className="text-base font-black text-[#C9A84C]">المعلومات الأساسية</h2>

            {error && <p className="rounded-xl border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">{error}</p>}

            <label className={labelCls}>
              <span className={spanCls}>اسم المنتج بالعربية *</span>
              <input name="name_ar" required className={inputCls} placeholder="مثال: عباية شيفون فاخرة" />
            </label>

            <label className={labelCls}>
              <span className={spanCls}>اسم المنتج بالإنجليزية *</span>
              <input name="name_en" required className={inputCls} placeholder="e.g. Luxury Chiffon Abaya" />
            </label>

            <label className={labelCls}>
              <span className={spanCls}>رابط المنتج (Slug) *</span>
              <input name="slug" required pattern="[a-z0-9-]+" className={`${inputCls} font-mono`} placeholder="luxury-chiffon-abaya" />
            </label>

            <label className={labelCls}>
              <span className={spanCls}>الوصف بالعربية</span>
              <textarea name="description_ar" rows={4} className={inputCls} />
            </label>

            <label className={labelCls}>
              <span className={spanCls}>الوصف بالإنجليزية</span>
              <textarea name="description_en" rows={4} className={inputCls} />
            </label>
          </div>

          {/* Sidebar column */}
          <div className="space-y-4">

            {/* Category & Brand */}
            <div className="space-y-4 rounded-3xl border border-[#E8DCC3] bg-[#FFFDF8] p-6">
              <h2 className="text-base font-black text-[#C9A84C]">التصنيف والعلامة</h2>

              <label className={labelCls}>
                <span className={spanCls}>التصنيف</span>
                <select name="category_id" className={inputCls}>
                  <option value="">-- اختر التصنيف --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name_ar}</option>
                  ))}
                </select>
              </label>

              <label className={labelCls}>
                <span className={spanCls}>العلامة التجارية</span>
                <select name="brand_id" className={inputCls}>
                  <option value="">-- اختر العلامة --</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </label>
            </div>

            {/* Flags */}
            <div className="space-y-3 rounded-3xl border border-[#E8DCC3] bg-[#FFFDF8] p-6">
              <h2 className="text-base font-black text-[#C9A84C]">الخيارات</h2>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="is_active" defaultChecked className="accent-[#C9A84C] w-4 h-4" />
                <span className="text-sm text-[#1F1B16]">منتج مفعّل</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="is_featured" className="accent-[#C9A84C] w-4 h-4" />
                <span className="text-sm text-[#1F1B16]">منتج مميز</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-2xl bg-[#C9A84C] px-6 py-3 text-sm font-black text-[#111] hover:bg-[#D8B95F] transition-colors disabled:opacity-50"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ المنتج'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-2xl border border-[#E8DCC3] px-4 py-3 text-sm text-[#6F6658] hover:border-[#C9A84C] hover:text-[#1F1B16] transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}