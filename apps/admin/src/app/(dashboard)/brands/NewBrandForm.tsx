'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function NewBrandForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    const formEl = e.currentTarget;
    const data = Object.fromEntries(new FormData(formEl));

    const res = await fetch('/api/catalog/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        slug: data.slug,
        is_active: data.is_active === 'on'
      })
    });

    if (res.ok) {
      setMsg('تم حفظ العلامة التجارية بنجاح');
      router.refresh();
      formEl.reset();
    } else {
      setMsg('فشل حفظ العلامة التجارية');
    }

    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      <label className="block space-y-2">
        <span className="text-sm font-bold text-[#6F6658]">اسم العلامة التجارية *</span>
        <input name="name" required className="w-full rounded-2xl border border-[#E8DCC3] bg-[#FFFDF8] px-4 py-3 text-[#1F1B16] outline-none focus:border-[#C9A84C]" />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-bold text-[#6F6658]">رابط العلامة *</span>
        <input name="slug" required className="w-full rounded-2xl border border-[#E8DCC3] bg-[#FFFDF8] px-4 py-3 text-[#1F1B16] outline-none focus:border-[#C9A84C]" />
      </label>

      <label className="flex items-center gap-2 text-sm font-bold text-[#6F6658]">
        <input name="is_active" type="checkbox" defaultChecked className="accent-[#C9A84C]" />
        مفعّلة
      </label>

      {msg ? <div className="rounded-2xl border border-[#E8DCC3] bg-[#FFFDF8]/20 p-3 text-sm text-[#C9A84C]">{msg}</div> : null}

      <button type="submit" disabled={saving} className="w-full rounded-2xl bg-[#C9A84C] px-5 py-3 text-sm font-black text-[#111111] hover:bg-[#D8B95F] disabled:opacity-50">
        {saving ? 'جار الحفظ...' : 'حفظ العلامة التجارية'}
      </button>
    </form>
  );
}