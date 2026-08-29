'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { z } from 'zod';

type VariantOption = { id: string; sku: string; stock_quantity: number; products: { name_ar?: string | null; name_en?: string | null } | null };
type BundleItem = { product_variant_id: string; quantity: number };

const bundleResponseSchema = z.object({
  variant_options: z.array(z.object({
    id: z.string(),
    sku: z.string(),
    stock_quantity: z.number().nullish().transform((value) => value ?? 0),
    products: z.object({ name_ar: z.string().nullish(), name_en: z.string().nullish() }).nullable(),
  })).default([]),
  bundle: z.object({
    name_ar: z.string().nullish(),
    name_en: z.string().nullish(),
    slug: z.string().nullish(),
    description_ar: z.string().nullish(),
    description_en: z.string().nullish(),
    bundle_price: z.number().nullish(),
    status: z.string().nullish(),
    bundle_items: z.array(z.object({ product_variant_id: z.string(), quantity: z.number() })).default([]),
  }).optional(),
});

function responseError(value: unknown, fallback: string): string {
  if (!value || typeof value !== 'object') return fallback;
  const error = (value as { error?: unknown }).error;
  return typeof error === 'string' ? error : fallback;
}

export function BundleEditor({ id }: { id?: string }) {
  const router = useRouter();
  const isAr = useLocale() === 'ar';
  const [form, setForm] = useState({ name_ar: '', name_en: '', slug: '', description_ar: '', description_en: '', bundle_price: 0, status: 'draft', items: [{ product_variant_id: '', quantity: 1 }] as BundleItem[] });
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(id ? `/api/admin/bundles/${id}` : '/api/admin/bundles?options=1').then(async (response) => {
      const rawPayload: unknown = await response.json();
      if (!response.ok) throw new Error(responseError(rawPayload, 'load_failed'));
      const payload = bundleResponseSchema.parse(rawPayload);
      setVariants(payload.variant_options ?? []);
      if (payload.bundle) {
        const bundle = payload.bundle;
        setForm({
          name_ar: bundle.name_ar ?? '', name_en: bundle.name_en ?? '', slug: bundle.slug ?? '',
          description_ar: bundle.description_ar ?? '', description_en: bundle.description_en ?? '',
          bundle_price: Number(bundle.bundle_price ?? 0), status: bundle.status ?? 'draft',
          items: bundle.bundle_items.map((item) => ({ product_variant_id: item.product_variant_id, quantity: item.quantity })),
        });
      }
    }).catch((reason) => setError(reason instanceof Error ? reason.message : 'load_failed')).finally(() => setLoading(false));
  }, [id]);

  function updateItem(index: number, patch: Partial<BundleItem>) {
    setForm((current) => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (form.items.some((item) => !item.product_variant_id)) { setError(isAr ? 'اختر خياراً لكل عنصر في الحزمة.' : 'Select a variant for every bundle item.'); return; }
    setSaving(true);
    const response = await fetch(id ? `/api/admin/bundles/${id}` : '/api/admin/bundles', {
      method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, bundle_price: Number(form.bundle_price) }),
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) { setError(responseError(payload, 'save_failed')); setSaving(false); return; }
    router.push('/bundles');
    router.refresh();
  }

  if (loading) return <p className="p-6 text-sm text-muted-foreground">{isAr ? 'جار التحميل...' : 'Loading...'}</p>;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-3"><Link href="/bundles" aria-label={isAr ? 'العودة إلى الحزم' : 'Back to bundles'} title={isAr ? 'العودة إلى الحزم' : 'Back to bundles'} className="rounded-md p-2 hover:bg-muted"><ArrowLeft size={18} /></Link><h1 className="text-2xl font-bold">{id ? (isAr ? 'تعديل حزمة المنتجات' : 'Edit Product Bundle') : (isAr ? 'إنشاء حزمة منتجات' : 'Create Product Bundle')}</h1></div>
      <form onSubmit={(event) => void submit(event)} className="space-y-6">
        {error && <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">{isAr ? 'الاسم بالإنجليزية' : 'Name (English)'}<input required value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} className="w-full rounded-md border p-2.5" /></label>
          <label className="space-y-1 text-sm">{isAr ? 'الاسم بالعربية' : 'Name (Arabic)'}<input required dir="rtl" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} className="w-full rounded-md border p-2.5" /></label>
          <label className="space-y-1 text-sm">{isAr ? 'المعرّف' : 'Slug'}<input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') })} className="w-full rounded-md border p-2.5 font-mono" /></label>
          <label className="space-y-1 text-sm">{isAr ? 'سعر الحزمة (ل.س)' : 'Bundle price (SYP)'}<input required type="number" min={0} value={form.bundle_price} onChange={(e) => setForm({ ...form, bundle_price: Number(e.target.value) })} className="w-full rounded-md border p-2.5" /></label>
          <label className="space-y-1 text-sm md:col-span-2">{isAr ? 'الوصف بالإنجليزية' : 'Description (English)'}<textarea rows={3} value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} className="w-full rounded-md border p-2.5" /></label>
          <label className="space-y-1 text-sm md:col-span-2">{isAr ? 'الوصف بالعربية' : 'Description (Arabic)'}<textarea dir="rtl" rows={3} value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} className="w-full rounded-md border p-2.5" /></label>
          <label className="space-y-1 text-sm">{isAr ? 'الحالة' : 'Status'}<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-md border p-2.5"><option value="draft">{isAr ? 'مسودة' : 'Draft'}</option><option value="published">{isAr ? 'منشورة' : 'Published'}</option><option value="archived">{isAr ? 'مؤرشفة' : 'Archived'}</option></select></label>
        </div>
        <section className="space-y-3 border-y py-5">
          <div className="flex items-center justify-between"><h2 className="font-semibold">{isAr ? 'عناصر الحزمة' : 'Bundle SKU items'}</h2><button type="button" onClick={() => setForm({ ...form, items: [...form.items, { product_variant_id: '', quantity: 1 }] })} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"><Plus size={15} />{isAr ? 'إضافة عنصر' : 'Add item'}</button></div>
          {form.items.map((item, index) => <div key={index} className="grid grid-cols-[minmax(0,1fr)_100px_40px] gap-2">
            <select aria-label={isAr ? `خيار العنصر ${index + 1}` : `Bundle item ${index + 1} SKU`} required value={item.product_variant_id} onChange={(e) => updateItem(index, { product_variant_id: e.target.value })} className="min-w-0 rounded-md border p-2.5 text-sm"><option value="">{isAr ? 'اختر رمز المنتج' : 'Select SKU'}</option>{variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.sku} - {variant.products?.name_en || variant.products?.name_ar || (isAr ? 'منتج' : 'Product')} ({isAr ? 'المخزون' : 'stock'} {variant.stock_quantity})</option>)}</select>
            <input aria-label={isAr ? 'الكمية' : 'Quantity'} type="number" min={1} max={100} value={item.quantity} onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })} className="rounded-md border p-2.5" />
            <button type="button" title={isAr ? 'إزالة العنصر' : 'Remove item'} aria-label={isAr ? 'إزالة العنصر' : 'Remove item'} disabled={form.items.length === 1} onClick={() => setForm({ ...form, items: form.items.filter((_, itemIndex) => itemIndex !== index) })} className="grid place-items-center rounded-md border text-red-600 disabled:opacity-30"><Trash2 size={16} /></button>
          </div>)}
        </section>
        <div className="flex justify-end"><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 font-semibold disabled:opacity-50"><Save size={17} />{saving ? (isAr ? 'جار الحفظ...' : 'Saving...') : (isAr ? 'حفظ' : 'Save')}</button></div>
      </form>
    </div>
  );
}
