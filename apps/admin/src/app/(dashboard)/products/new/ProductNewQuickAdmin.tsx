'use client';

import Link from 'next/link';
import { ArrowRight, Check, PackagePlus, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';

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
        }),
      });
      router.push(product.id ? `/products?open=${product.id}` : '/products');
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'فشل إنشاء المنتج');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5" dir="rtl">
      <section className="flex flex-col gap-4 rounded-lg border border-[#E5E0D8] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/products" className="inline-flex items-center gap-2 text-xs font-black text-[#B8860B]">
            <ArrowRight size={14} /> المنتجات
          </Link>
          <h1 className="mt-2 text-2xl font-black text-[#1C1917]">منتج جديد</h1>
        </div>
        <button type="button" onClick={() => router.refresh()} className="inline-flex items-center gap-2 rounded-lg border border-[#E5E0D8] px-4 py-2 text-sm font-bold text-[#57534E] hover:border-[#B8860B]">
          <RefreshCw size={16} /> تحديث
        </button>
      </section>

      {msg ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{msg}</div> : null}

      <form onSubmit={(event) => void submit(event)} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-lg border border-[#E5E0D8] bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs font-black text-[#8B8172]">الاسم العربي</span>
              <input value={form.name_ar} onChange={(event) => setForm((current) => ({ ...current, name_ar: event.target.value }))} className={inputClass} />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-black text-[#8B8172]">English name</span>
              <input value={form.name_en} onChange={(event) => setForm((current) => ({ ...current, name_en: event.target.value, slug: current.slug || slugify(event.target.value) }))} className={inputClass} dir="ltr" />
            </label>
            <label className="grid gap-1 md:col-span-2">
              <span className="text-xs font-black text-[#8B8172]">Slug</span>
              <input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))} className={inputClass} dir="ltr" />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-black text-[#8B8172]">الوصف العربي</span>
              <textarea value={form.description_ar} onChange={(event) => setForm((current) => ({ ...current, description_ar: event.target.value }))} rows={7} className={inputClass} />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-black text-[#8B8172]">English description</span>
              <textarea value={form.description_en} onChange={(event) => setForm((current) => ({ ...current, description_en: event.target.value }))} rows={7} className={inputClass} dir="ltr" />
            </label>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-[#E5E0D8] bg-white p-5 shadow-sm">
            <div className="grid gap-4">
              <label className="grid gap-1">
                <span className="text-xs font-black text-[#8B8172]">التصنيف</span>
                <select value={form.category_id} onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))} className={inputClass}>
                  <option value="">بدون تصنيف</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name_ar}</option>)}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-black text-[#8B8172]">الماركة</span>
                <select value={form.brand_id} onChange={(event) => setForm((current) => ({ ...current, brand_id: event.target.value }))} className={inputClass}>
                  <option value="">بدون ماركة</option>
                  {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-[#E5E0D8] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <TogglePill active={form.is_active} label="نشط" onClick={() => setForm((current) => ({ ...current, is_active: !current.is_active }))} />
              <TogglePill active={form.is_featured} label="مميز" onClick={() => setForm((current) => ({ ...current, is_featured: !current.is_featured }))} />
            </div>
          </section>

          <button type="submit" disabled={!ready || saving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#B8860B] px-5 py-3 text-sm font-black text-white hover:bg-[#9A7209] disabled:cursor-not-allowed disabled:opacity-50">
            <PackagePlus size={17} />
            {saving ? 'جار الإنشاء...' : 'إنشاء المنتج'}
          </button>
        </aside>
      </form>
    </div>
  );
}
