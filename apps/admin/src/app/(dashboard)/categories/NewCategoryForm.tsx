'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function NewCategoryForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    const formEl = e.currentTarget;
    const data = Object.fromEntries(new FormData(formEl));

    const res = await fetch('/api/catalog/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name_ar: data.name_ar,
        name_en: data.name_en,
        slug: data.slug,
        sort_order: Number(data.sort_order) || 0,
        is_active: data.is_active === 'on'
      })
    });

    if (res.ok) {
      setMsg('تم حفظ التصنيف بنجاح');
      router.refresh();
      formEl.reset();
    } else {
      setMsg('فشل حفظ التصنيف');
    }

    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      <label className="block space-y-2">
        <span className="text-sm font-bold text-[#6F6658]">اسم التصنيف بالعربية *</span>
        <input name="name_ar" required className="w-full rounded-2xl border border-[#E8DCC3] bg-[#FFFDF8] px-4 py-3 text-[#1F1B16] outline-none focus:border-[#C9A84C]" />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-bold text-[#6F6658]">اسم التصنيف بالإنجليزية *</span>
        <input name="name_en" required className="w-full rounded-2xl border border-[#E8DCC3] bg-[#FFFDF8] px-4 py-3 text-[#1F1B16] outline-none focus:border-[#C9A84C]" />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-bold text-[#6F6658]">رابط التصنيف *</span>
        <input name="slug" required className="w-full rounded-2xl border border-[#E8DCC3] bg-[#FFFDF8] px-4 py-3 text-[#1F1B16] outline-none focus:border-[#C9A84C]" />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-bold text-[#6F6658]">ترتيب العرض</span>
        <input name="sort_order" type="number" defaultValue={0} className="w-full rounded-2xl border border-[#E8DCC3] bg-[#FFFDF8] px-4 py-3 text-[#1F1B16] outline-none focus:border-[#C9A84C]" />
      </label>

      <label className="flex items-center gap-2 text-sm font-bold text-[#6F6658]">
        <input name="is_active" type="checkbox" defaultChecked className="accent-[#C9A84C]" />
        مفعّل
      </label>

      {msg ? <div className="rounded-2xl border border-[#E8DCC3] bg-[#FFFDF8]/20 p-3 text-sm text-[#C9A84C]">{msg}</div> : null}

      <button type="submit" disabled={saving} className="w-full rounded-2xl bg-[#C9A84C] px-5 py-3 text-sm font-black text-[#111111] hover:bg-[#D8B95F] disabled:opacity-50">
        {saving ? 'جار الحفظ...' : 'حفظ التصنيف'}
      </button>
    </form>
  );
}