'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Save, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { z } from 'zod';

type ProductOption = { id: string; name_ar: string; name_en: string; status: string };
type CollectionPayload = {
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string;
  description_en: string;
  is_featured_on_homepage: boolean;
  has_standalone_page: boolean;
  is_active: boolean;
  sort_order: number;
  product_ids: string[];
};

const EMPTY: CollectionPayload = {
  name_ar: '', name_en: '', slug: '', description_ar: '', description_en: '',
  is_featured_on_homepage: false, has_standalone_page: true, is_active: true,
  sort_order: 0, product_ids: [],
};

const collectionResponseSchema = z.object({
  product_options: z.array(z.object({
    id: z.string(),
    name_ar: z.string(),
    name_en: z.string(),
    status: z.string(),
  })).default([]),
  collection: z.object({
    name_ar: z.string().nullish(),
    name_en: z.string().nullish(),
    slug: z.string().nullish(),
    description_ar: z.string().nullish(),
    description_en: z.string().nullish(),
    is_featured_on_homepage: z.boolean().nullish(),
    has_standalone_page: z.boolean().nullish(),
    is_active: z.boolean().nullish(),
    sort_order: z.number().nullish(),
    collection_products: z.array(z.object({ product_id: z.string(), sort_order: z.number().nullish() })).default([]),
  }).optional(),
});

function responseError(value: unknown, fallback: string): string {
  if (!value || typeof value !== 'object') return fallback;
  const error = (value as { error?: unknown }).error;
  return typeof error === 'string' ? error : fallback;
}

export function CollectionEditor({ id }: { id?: string }) {
  const router = useRouter();
  const isAr = useLocale() === 'ar';
  const [form, setForm] = useState(EMPTY);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const url = id ? `/api/admin/collections/${id}` : '/api/admin/collections?options=1';
    fetch(url).then(async (response) => {
      const rawPayload: unknown = await response.json();
      if (!response.ok) throw new Error(responseError(rawPayload, 'load_failed'));
      const payload = collectionResponseSchema.parse(rawPayload);
      setProducts(payload.product_options ?? []);
      if (payload.collection) {
        const collection = payload.collection;
        setForm({
          name_ar: collection.name_ar ?? '', name_en: collection.name_en ?? '', slug: collection.slug ?? '',
          description_ar: collection.description_ar ?? '', description_en: collection.description_en ?? '',
          is_featured_on_homepage: Boolean(collection.is_featured_on_homepage),
          has_standalone_page: Boolean(collection.has_standalone_page), is_active: Boolean(collection.is_active),
          sort_order: Number(collection.sort_order ?? 0),
          product_ids: [...collection.collection_products]
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((item) => item.product_id),
        });
      }
    }).catch((reason) => setError(reason instanceof Error ? reason.message : 'load_failed')).finally(() => setLoading(false));
  }, [id]);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => `${product.name_ar} ${product.name_en}`.toLowerCase().includes(query));
  }, [products, search]);

  function toggleProduct(productId: string) {
    setForm((current) => ({
      ...current,
      product_ids: current.product_ids.includes(productId)
        ? current.product_ids.filter((id) => id !== productId)
        : [...current.product_ids, productId],
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const response = await fetch(id ? `/api/admin/collections/${id}` : '/api/admin/collections', {
      method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      setError(responseError(payload, 'save_failed'));
      setSaving(false);
      return;
    }
    router.push('/collections');
    router.refresh();
  }

  if (loading) return <p className="p-6 text-sm text-muted-foreground">{isAr ? 'جار التحميل...' : 'Loading...'}</p>;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-3"><Link href="/collections" aria-label={isAr ? 'العودة إلى المجموعات' : 'Back to collections'} title={isAr ? 'العودة إلى المجموعات' : 'Back to collections'} className="rounded-md p-2 hover:bg-muted"><ArrowLeft size={18} /></Link><h1 className="text-2xl font-bold">{id ? (isAr ? 'تعديل المجموعة' : 'Edit Collection') : (isAr ? 'إنشاء مجموعة' : 'Create Collection')}</h1></div>
      <form onSubmit={(event) => void submit(event)} className="space-y-6">
        {error && <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">{isAr ? 'الاسم بالإنجليزية' : 'Name (English)'}<input required value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} className="w-full rounded-md border p-2.5" /></label>
          <label className="space-y-1 text-sm">{isAr ? 'الاسم بالعربية' : 'Name (Arabic)'}<input required dir="rtl" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} className="w-full rounded-md border p-2.5" /></label>
          <label className="space-y-1 text-sm">{isAr ? 'المعرّف' : 'Slug'}<input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') })} className="w-full rounded-md border p-2.5 font-mono" /></label>
          <label className="space-y-1 text-sm">{isAr ? 'ترتيب العرض' : 'Sort order'}<input type="number" min={0} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="w-full rounded-md border p-2.5" /></label>
          <label className="space-y-1 text-sm md:col-span-2">{isAr ? 'الوصف بالإنجليزية' : 'Description (English)'}<textarea rows={3} value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} className="w-full rounded-md border p-2.5" /></label>
          <label className="space-y-1 text-sm md:col-span-2">{isAr ? 'الوصف بالعربية' : 'Description (Arabic)'}<textarea dir="rtl" rows={3} value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} className="w-full rounded-md border p-2.5" /></label>
        </div>
        <div className="flex flex-wrap gap-5 border-y py-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />{isAr ? 'نشطة' : 'Active'}</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_featured_on_homepage} onChange={(e) => setForm({ ...form, is_featured_on_homepage: e.target.checked })} />{isAr ? 'مميزة في الصفحة الرئيسية' : 'Featured on homepage'}</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.has_standalone_page} onChange={(e) => setForm({ ...form, has_standalone_page: e.target.checked })} />{isAr ? 'لها صفحة مستقلة' : 'Standalone page'}</label>
        </div>
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{isAr ? 'المنتجات' : 'Products'} ({form.product_ids.length})</h2><label className="relative block max-w-xs flex-1"><Search size={15} className="absolute left-2.5 top-2.5 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isAr ? 'ابحث في المنتجات' : 'Search products'} className="w-full rounded-md border py-2 pl-8 pr-3 text-sm" /></label></div>
          <div className="max-h-72 overflow-y-auto border">
            {visibleProducts.map((product) => <label key={product.id} className="flex items-center gap-3 border-b px-3 py-2 text-sm last:border-b-0"><input type="checkbox" checked={form.product_ids.includes(product.id)} onChange={() => toggleProduct(product.id)} /><span className="flex-1">{product.name_en} / {product.name_ar}</span><span className="text-xs text-muted-foreground">{product.status}</span></label>)}
          </div>
        </section>
        <div className="flex justify-end"><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 font-semibold disabled:opacity-50"><Save size={17} />{saving ? (isAr ? 'جار الحفظ...' : 'Saving...') : (isAr ? 'حفظ' : 'Save')}</button></div>
      </form>
    </div>
  );
}
