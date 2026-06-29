'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

interface HomeSection {
  id: string;
  title_ar: string;
  title_en?: string | null;
  type: string;
  position: number;
  is_active: boolean;
}

function pickArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];

  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    for (const key of ['data', 'items', 'sections', 'homepage_sections']) {
      const candidate = obj[key];
      if (Array.isArray(candidate)) return candidate as T[];
    }
  }

  return [];
}

export default function HomepagePage() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title_ar: '',
    title_en: '',
    type: 'featured_products',
    position: 0,
    is_active: true
  });

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/catalog/homepage', { cache: 'no-store' });
    const payload = await res.json().catch(() => null);
    setSections(pickArray<HomeSection>(payload));
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await fetch('/api/catalog/homepage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    setForm({
      title_ar: '',
      title_en: '',
      type: 'featured_products',
      position: 0,
      is_active: true
    });

    void load();
  };

  const toggle = async (id: string, is_active: boolean) => {
    await fetch(`/api/catalog/homepage/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !is_active })
    });

    void load();
  };

  const remove = async (id: string) => {
    if (!window.confirm('هل تريد حذف هذا القسم؟')) return;

    await fetch(`/api/catalog/homepage/${id}`, { method: 'DELETE' });
    void load();
  };

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-3xl border border-white/10 bg-[#101010] p-6 shadow-2xl">
        <h1 className="text-3xl font-black text-white">أقسام الواجهة</h1>
        <p className="mt-2 text-sm text-[#9CA3AF]">
          إدارة أقسام الصفحة الرئيسية في واجهة المتجر.
        </p>
      </section>

      <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-[#101010] p-6 shadow-2xl">
        <h2 className="mb-5 text-xl font-black text-white">إضافة قسم جديد</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-bold text-[#B8B1A4]">العنوان بالعربية</span>
            <input
              value={form.title_ar}
              onChange={(e) => setForm((f) => ({ ...f, title_ar: e.target.value }))}
              required
              className="w-full rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 text-white outline-none focus:border-[#C9A84C]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-[#B8B1A4]">العنوان بالإنجليزية</span>
            <input
              value={form.title_en}
              onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))}
              required
              className="w-full rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 text-white outline-none focus:border-[#C9A84C]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-[#B8B1A4]">النوع</span>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 text-white outline-none focus:border-[#C9A84C]"
            >
              <option value="hero">Hero</option>
              <option value="featured_products">منتجات مميزة</option>
              <option value="banner">Banner</option>
              <option value="categories_grid">شبكة التصنيفات</option>
              <option value="loyalty_teaser">الولاء</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-[#B8B1A4]">الترتيب</span>
            <input
              type="number"
              value={form.position}
              onChange={(e) => setForm((f) => ({ ...f, position: Number(e.target.value) }))}
              className="w-full rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 text-white outline-none focus:border-[#C9A84C]"
            />
          </label>
        </div>

        <button type="submit" className="mt-5 w-full rounded-2xl bg-[#C9A84C] px-5 py-3 text-sm font-black text-[#111111] hover:bg-[#D8B95F]">
          إضافة القسم
        </button>
      </form>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#101010] shadow-2xl">
        {loading ? (
          <div className="p-10 text-center text-[#9CA3AF]">جار التحميل...</div>
        ) : sections.length === 0 ? (
          <div className="p-10 text-center text-[#9CA3AF]">لا توجد أقسام.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-[#C9A84C]">
                <tr>
                  <th className="px-4 py-4 text-right font-black">العنوان</th>
                  <th className="px-4 py-4 text-right font-black">النوع</th>
                  <th className="px-4 py-4 text-right font-black">الترتيب</th>
                  <th className="px-4 py-4 text-right font-black">الحالة</th>
                  <th className="px-4 py-4 text-left font-black">الإجراء</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {sections.map((s) => (
                  <tr key={s.id} className="text-[#EDE7DD] hover:bg-white/[0.03]">
                    <td className="px-4 py-4 font-bold text-white">{s.title_ar}</td>
                    <td className="px-4 py-4">{s.type}</td>
                    <td className="px-4 py-4">{s.position}</td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => toggle(s.id, s.is_active)}
                        className={[
                          'rounded-full border px-3 py-1 text-xs font-black',
                          s.is_active
                            ? 'border-green-400/20 bg-green-400/10 text-green-200'
                            : 'border-red-400/20 bg-red-400/10 text-red-200'
                        ].join(' ')}
                      >
                        {s.is_active ? 'مفعّل' : 'غير مفعّل'}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-left">
                      <button
                        type="button"
                        onClick={() => remove(s.id)}
                        className="text-xs font-black text-red-300 hover:text-red-200"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}