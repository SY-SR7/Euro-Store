/// <reference lib="dom" />
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface Category { id: string; name_ar: string }
interface Brand    { id: string; name: string }
interface Product {
  id: string; name_ar: string; name_en: string; slug: string;
  description_ar: string | null; description_en: string | null;
  category_id: string | null; brand_id: string | null;
  is_featured: boolean; is_active: boolean;
}
interface Props { product: Product; categories: Category[]; brands: Brand[] }

export function EditProductForm({ product, categories, brands }: Props) {
  const t      = useTranslations('adminCatalog');
  const tC     = useTranslations('common');
  const router = useRouter();
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    const formEl = e.currentTarget as HTMLFormElement; const fd = new FormData(formEl);
    const d = Object.fromEntries(fd);
    const res = await fetch(`/api/catalog/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name_ar:        d.name_ar,
        name_en:        d.name_en,
        slug:           d.slug,
        description_ar: (d.description_ar as string) || undefined,
        description_en: (d.description_en as string) || undefined,
        category_id:    (d.category_id as string)    || null,
        brand_id:       (d.brand_id    as string)    || null,
        is_featured:    d.is_featured === 'on',
        is_active:      d.is_active   === 'on',
      }),
    });
    if (res.ok) { setSuccess(t('saveSuccess')); router.refresh(); }
    else        { setError(t('saveFailed')); }
    setSaving(false);
  }

  async function handleDelete() {
    if (!window.confirm(t('confirmDelete'))) return;
    setDeleting(true);
    const res = await fetch(`/api/catalog/products/${product.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/products');
    else { setError(t('saveFailed')); setDeleting(false); }
  }

  const inputCls = "rounded border border-[#2E2E2E] bg-[#151515] px-3 py-2.5 text-[#E2E2E2] outline-none focus:border-[#C9A84C] w-full";
  const labelCls = "flex flex-col gap-1.5 text-sm";
  const spanCls  = "text-[#9CA3AF]";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error   && <p className="rounded border border-red-800   bg-red-900/20   p-4 text-sm text-red-400">{error}</p>}
      {success && <p className="rounded border border-green-800 bg-green-900/20 p-4 text-sm text-green-400">{success}</p>}

      <label className={labelCls}>
        <span className={spanCls}>{t('productNameAr')} *</span>
        <input name="name_ar" required defaultValue={product.name_ar} className={inputCls} />
      </label>

      <label className={labelCls}>
        <span className={spanCls}>{t('productNameEn')} *</span>
        <input name="name_en" required defaultValue={product.name_en} className={inputCls} />
      </label>

      <label className={labelCls}>
        <span className={spanCls}>{t('productSlug')} *</span>
        <input name="slug" required pattern="[a-z0-9-]+" defaultValue={product.slug} className={`${inputCls} font-mono`} />
      </label>

      <label className={labelCls}>
        <span className={spanCls}>{t('productDescription')}</span>
        <textarea name="description_ar" rows={3} defaultValue={product.description_ar ?? ''} className={`${inputCls} resize-y`} />
      </label>

      <label className={labelCls}>
        <span className={spanCls}>{t('productDescriptionEn')}</span>
        <textarea name="description_en" rows={3} defaultValue={product.description_en ?? ''} className={`${inputCls} resize-y`} />
      </label>

      <label className={labelCls}>
        <span className={spanCls}>{t('category')}</span>
        <select name="category_id" defaultValue={product.category_id ?? ''} className={inputCls}>
          <option value="">— {t('category')} —</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
        </select>
      </label>

      <label className={labelCls}>
        <span className={spanCls}>{t('brand')}</span>
        <select name="brand_id" defaultValue={product.brand_id ?? ''} className={inputCls}>
          <option value="">— {t('brand')} —</option>
          {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </label>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-[#9CA3AF] cursor-pointer">
          <input type="checkbox" name="is_featured" defaultChecked={product.is_featured} className="accent-[#C9A84C]" />
          {t('featured')}
        </label>
        <label className="flex items-center gap-2 text-sm text-[#9CA3AF] cursor-pointer">
          <input type="checkbox" name="is_active" defaultChecked={product.is_active} className="accent-[#C9A84C]" />
          {t('active')}
        </label>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="rounded-sm bg-[#C9A84C] px-6 py-2.5 text-sm font-semibold text-[#111] hover:bg-[#D8B95F] transition-colors disabled:opacity-50">
            {saving ? tC('loading') : tC('save')}
          </button>
          <button type="button" onClick={() => router.back()}
            className="rounded-sm border border-[#2E2E2E] px-6 py-2.5 text-sm text-[#9CA3AF] hover:border-[#C9A84C] hover:text-[#E2E2E2] transition-colors">
            {tC('cancel')}
          </button>
        </div>
        <button type="button" onClick={handleDelete} disabled={deleting}
          className="rounded-sm border border-red-800 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-50">
          {deleting ? tC('loading') : tC('delete')}
        </button>
      </div>
    </form>
  );
}