'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function NewProductPage() {
  const t = useTranslations('adminCatalog');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    const res = await fetch('/api/catalog/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name_ar:        data.name_ar,
        name_en:        data.name_en,
        slug:           data.slug,
        description_ar: data.description_ar,
        description_en: data.description_en,
        is_featured:    data.is_featured === 'on',
        is_active:      data.is_active   === 'on',
      }),
    });

    if (res.ok) {
      router.push('/products');
    } else {
      setError(t('saveFailed'));
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-semibold mb-8">{t('newProduct')}</h1>
      {error && <p className="mb-4 rounded border border-red-800 bg-red-900/20 p-4 text-sm text-red-400">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-[#9CA3AF]">{t('productNameAr')} *</span>
          <input name="name_ar" required className="rounded border border-[#2E2E2E] bg-[#151515] px-3 py-2.5 text-[#E2E2E2] outline-none focus:border-[#C9A84C]" />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-[#9CA3AF]">{t('productNameEn')} *</span>
          <input name="name_en" required className="rounded border border-[#2E2E2E] bg-[#151515] px-3 py-2.5 text-[#E2E2E2] outline-none focus:border-[#C9A84C]" />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-[#9CA3AF]">{t('productSlug')} *</span>
          <input name="slug" required pattern="[a-z0-9-]+" className="rounded border border-[#2E2E2E] bg-[#151515] px-3 py-2.5 font-mono text-[#E2E2E2] outline-none focus:border-[#C9A84C]" />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-[#9CA3AF]">{t('productDescription')}</span>
          <textarea name="description_ar" rows={3} className="rounded border border-[#2E2E2E] bg-[#151515] px-3 py-2.5 text-[#E2E2E2] outline-none focus:border-[#C9A84C] resize-y" />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-[#9CA3AF]">{t('productDescriptionEn')}</span>
          <textarea name="description_en" rows={3} className="rounded border border-[#2E2E2E] bg-[#151515] px-3 py-2.5 text-[#E2E2E2] outline-none focus:border-[#C9A84C] resize-y" />
        </label>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-[#9CA3AF] cursor-pointer">
            <input type="checkbox" name="is_featured" className="accent-[#C9A84C]" />
            {t('featured')}
          </label>
          <label className="flex items-center gap-2 text-sm text-[#9CA3AF] cursor-pointer">
            <input type="checkbox" name="is_active" defaultChecked className="accent-[#C9A84C]" />
            {t('active')}
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-sm bg-[#C9A84C] px-6 py-2.5 text-sm font-semibold text-[#111] hover:bg-[#D8B95F] transition-colors disabled:opacity-50"
          >
            {saving ? tCommon('loading') : t('saveProduct')}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-sm border border-[#2E2E2E] px-6 py-2.5 text-sm text-[#9CA3AF] hover:border-[#C9A84C] hover:text-[#E2E2E2] transition-colors"
          >
            {tCommon('cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
