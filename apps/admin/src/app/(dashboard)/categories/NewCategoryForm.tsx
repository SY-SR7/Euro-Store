/// <reference lib="dom" />
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function NewCategoryForm() {
  const t = useTranslations('adminCatalog');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    const formEl = e.currentTarget as HTMLFormElement; const data = Object.fromEntries(new FormData(formEl));
    const res = await fetch('/api/catalog/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name_ar:    data.name_ar,
        name_en:    data.name_en,
        slug:       data.slug,
        sort_order: Number(data.sort_order) || 0,
        is_active:  data.is_active === 'on',
      }),
    });
    if (res.ok) {
      setMsg(t('saveSuccess'));
      router.refresh();
      (e.target as HTMLFormElement).reset();
    } else {
      setMsg(t('saveFailed'));
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-[#9CA3AF]">{t('categoryNameAr')} *</span>
        <input name="name_ar" required className="rounded border border-[#2E2E2E] bg-[#151515] px-3 py-2 text-[#E2E2E2] outline-none focus:border-[#C9A84C]" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-[#9CA3AF]">{t('categoryNameEn')} *</span>
        <input name="name_en" required className="rounded border border-[#2E2E2E] bg-[#151515] px-3 py-2 text-[#E2E2E2] outline-none focus:border-[#C9A84C]" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-[#9CA3AF]">{t('categorySlug')} *</span>
        <input name="slug" required pattern="[a-z0-9-]+" className="rounded border border-[#2E2E2E] bg-[#151515] px-3 py-2 font-mono text-[#E2E2E2] outline-none focus:border-[#C9A84C]" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-[#9CA3AF]">{t('sortOrder')} <span className="text-[#6B7280]">({t('sortOrderHint')})</span></span>
        <input name="sort_order" type="number" defaultValue={0} className="rounded border border-[#2E2E2E] bg-[#151515] px-3 py-2 text-[#E2E2E2] outline-none focus:border-[#C9A84C]" />
      </label>
      <label className="flex items-center gap-2 text-sm text-[#9CA3AF] cursor-pointer">
        <input type="checkbox" name="is_active" defaultChecked className="accent-[#C9A84C]" />
        {t('active')}
      </label>
      {msg && <p className="text-sm text-[#C9A84C]">{msg}</p>}
      <button type="submit" disabled={saving} className="rounded-sm bg-[#C9A84C] px-5 py-2.5 text-sm font-semibold text-[#111] hover:bg-[#D8B95F] transition-colors disabled:opacity-50">
        {saving ? tCommon('loading') : t('saveCategory')}
      </button>
    </form>
  );
}


