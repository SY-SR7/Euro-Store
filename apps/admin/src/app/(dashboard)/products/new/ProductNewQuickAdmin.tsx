'use client';

import Link from 'next/link';
import { ArrowRight, Check, PackagePlus, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';

type Category = { id: string; name_ar: string; name_en?: string | null };
type Brand = { id: string; name: string };

const inputClass =
  'w-full rounded-lg border border-[#E5E0D8] bg-white px-3 py-2 text-sm text-[#1C1917] outline-none transition focus:border-[#B8860B]';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const payload = (await res.json().catch(() => null)) as T | { error?: string } | null;
  if (!res.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && payload.error
        ? String(payload.error)
        : 'request_failed';
    throw new Error(message);
  }
  return payload as T;
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function TogglePill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${active ? 'border-green-200 bg-green-50 text-green-700' : 'border-[#E5E0D8] bg-[#FAF7EF] text-[#8B8172] hover:border-[#B8860B]'}`}>
      {active ? <Check size={13} /> : null}
      {label}
    </button>
  );
}

export default function ProductNewQuickAdmin() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    name_ar: '',
    name_en: '',
    slug: '',
    description_ar: '',
    description_en: '',
    category_id: '',
    brand_id: '',
    is_active: true,
    is_featured: false,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  
  const t = useTranslations('adminCatalog');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isAr = locale === 'ar';

  useEffect(() => {
    Promise.all([
      fetchJson<Category[]>('/api/catalog/categories').catch(() => []),
      fetchJson<Brand[]>('/api/catalog/brands').catch(() => []),
    ]).then(([nextCategories, nextBrands]) => {
      setCategories(Array.isArray(nextCategories) ? nextCategories : []);
      setBrands(Array.isArray(nextBrands) ? nextBrands : []);
    });
  }, []);

  const ready = useMemo(() => Boolean(form.name_ar.trim() && form.name_en.trim() && (form.slug.trim() || slugify(form.name_en))), [form.name_ar, form.name_en, form.slug]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || saving) return;
    setSaving(true);
    setMsg('');
    try {
      let media: { type: 'image' | 'video', url: string, isPrimary: boolean, originalName: string }[] = [];
      if (files.length > 0) {
        const formData = new FormData();
        for (const file of files) {
          formData.append('file', file);
        }
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        if (!uploadRes.ok) {
          const uErr = await uploadRes.json().catch(() => ({}));
          throw new Error(uErr.error || 'Failed to upload media');
        }
        const uploadData = await uploadRes.json();
        media = uploadData.files.map((f: any) => ({
          ...f,
          isPrimary: f.originalName === primaryFile?.name
        }));
      }

      const product = await fetchJson<{ id?: string }>('/api/catalog/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_ar: form.name_ar.trim(),
          name_en: form.name_en.trim(),
          slug: form.slug.trim() || slugify(form.name_en),
          description_ar: form.description_ar.trim() || form.name_ar.trim(),
          description_en: form.description_en.trim() || form.name_en.trim(),
          category_id: form.category_id || undefined,
          brand_id: form.brand_id || undefined,
          is_active: form.is_active,
          is_featured: form.is_featured,
          media,
        }),
      });
      router.push(product.id ? `/products?open=${product.id}` : '/products');
    } catch (error) {
      setMsg(error instanceof Error ? error.message : t('saveFailed', { fallback: 'فشل الحفظ' }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5" dir={isAr ? "rtl" : "ltr"}>
      <section className="flex flex-col gap-4 rounded-lg border border-[#E5E0D8] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/products" className="inline-flex items-center gap-2 text-xs font-black text-[#B8860B]">
            <ArrowRight size={14} className={isAr ? "" : "rotate-180"} /> {t('productsTitle', { fallback: 'المنتجات' })}
          </Link>
          <h1 className="mt-2 text-2xl font-black text-[#1C1917]">{t('newProduct', { fallback: 'منتج جديد' })}</h1>
        </div>
        <button type="button" onClick={() => router.refresh()} className="inline-flex items-center gap-2 rounded-lg border border-[#E5E0D8] px-4 py-2 text-sm font-bold text-[#57534E] hover:border-[#B8860B]">
          <RefreshCw size={16} /> {tCommon('refresh', { fallback: 'تحديث' })}
        </button>
      </section>

      {msg ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{msg}</div> : null}

      <form onSubmit={(event) => void submit(event)} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid content-start gap-5">
          <section className="rounded-lg border border-[#E5E0D8] bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs font-black text-[#8B8172]">{t('productNameAr', { fallback: 'الاسم العربي' })}</span>
              <input value={form.name_ar} onChange={(event) => setForm((current) => ({ ...current, name_ar: event.target.value }))} className={inputClass} dir={isAr ? "rtl" : "ltr"} />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-black text-[#8B8172]">{t('productNameEn', { fallback: 'الاسم بالإنجليزية' })}</span>
              <input value={form.name_en} onChange={(event) => setForm((current) => ({ ...current, name_en: event.target.value, slug: current.slug || slugify(event.target.value) }))} className={inputClass} dir="ltr" />
            </label>
            <label className="grid gap-1 md:col-span-2">
              <span className="text-xs font-black text-[#8B8172]">{t('productSlug', { fallback: 'رابط المنتج' })}</span>
              <input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))} className={inputClass} dir="ltr" />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-black text-[#8B8172]">{t('descriptionAr', { fallback: 'الوصف العربي' })}</span>
              <textarea value={form.description_ar} onChange={(event) => setForm((current) => ({ ...current, description_ar: event.target.value }))} rows={7} className={inputClass} dir={isAr ? "rtl" : "ltr"} />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-black text-[#8B8172]">{t('descriptionEn', { fallback: 'الوصف بالإنجليزية' })}</span>
              <textarea value={form.description_en} onChange={(event) => setForm((current) => ({ ...current, description_en: event.target.value }))} rows={7} className={inputClass} dir="ltr" />
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-[#E5E0D8] bg-white p-5 shadow-sm">
          <div className="mb-4 text-sm font-black text-[#1C1917]">{t('media', { fallback: 'الوسائط (صور وفيديوهات)' })}</div>
          <div className="grid gap-4">
            <input 
              type="file" 
              multiple 
              accept="image/*,video/*"
              onChange={(e) => {
                if (e.target.files) {
                  const newFiles = Array.from(e.target.files);
                  setFiles((prev) => {
                    const combined = [...prev, ...newFiles];
                    if (!primaryFile && combined.length > 0) setPrimaryFile(combined[0]);
                    return combined;
                  });
                }
              }} 
              className={inputClass}
            />
            {files.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                {files.map((file, idx) => {
                  const isImage = file.type.startsWith('image/');
                  const url = URL.createObjectURL(file);
                  const isPrimary = file === primaryFile;
                  return (
                    <div key={idx} className={`relative overflow-hidden rounded-lg border-2 ${isPrimary ? 'border-[#B8860B]' : 'border-transparent'}`}>
                      {isImage ? (
                        <img src={url} alt={file.name} className="h-24 w-full bg-gray-100 object-cover" />
                      ) : (
                        <video src={url} className="h-24 w-full bg-gray-100 object-cover" />
                      )}
                      <button type="button" onClick={() => setFiles(files.filter(f => f !== file))} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs leading-none text-white shadow-sm">×</button>
                      <button type="button" onClick={() => setPrimaryFile(file)} className={`absolute bottom-0 left-0 right-0 py-1 text-center text-[10px] font-bold text-white transition ${isPrimary ? 'bg-[#B8860B]' : 'bg-black/50 hover:bg-black/70'}`}>
                        {isPrimary ? 'الرئيسية' : 'تعيين رئيسية'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      <aside className="space-y-5">
        <section className="rounded-lg border border-[#E5E0D8] bg-white p-5 shadow-sm">
            <div className="grid gap-4">
              <label className="grid gap-1">
                <span className="text-xs font-black text-[#8B8172]">{t('category', { fallback: 'التصنيف' })}</span>
                <select value={form.category_id} onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))} className={inputClass} dir={isAr ? "rtl" : "ltr"}>
                  <option value="">{t('uncategorized', { fallback: 'بدون تصنيف' })}</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{isAr ? category.name_ar : (category.name_en || category.name_ar)}</option>)}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-black text-[#8B8172]">{t('brand', { fallback: 'الماركة' })}</span>
                <select value={form.brand_id} onChange={(event) => setForm((current) => ({ ...current, brand_id: event.target.value }))} className={inputClass} dir={isAr ? "rtl" : "ltr"}>
                  <option value="">{t('unbranded', { fallback: 'بدون ماركة' })}</option>
                  {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-[#E5E0D8] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <TogglePill active={form.is_active} label={t('active', { fallback: 'نشط' })} onClick={() => setForm((current) => ({ ...current, is_active: !current.is_active }))} />
              <TogglePill active={form.is_featured} label={t('featured', { fallback: 'مميز' })} onClick={() => setForm((current) => ({ ...current, is_featured: !current.is_featured }))} />
            </div>
          </section>

          <button type="submit" disabled={!ready || saving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#B8860B] px-5 py-3 text-sm font-black text-white hover:bg-[#9A7209] disabled:cursor-not-allowed disabled:opacity-50">
            <PackagePlus size={17} />
            {saving ? tCommon('saving', { fallback: 'جار الحفظ...' }) : t('createProductBtn', { fallback: 'إنشاء المنتج' })}
          </button>
        </aside>
      </form>
    </div>
  );
}
