'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

interface HomeSection {
  id: string;
  section_key: string;
  title_ar: string;
  title_en?: string | null;
  is_active: boolean;
  sort_order: number;
}

const SECTION_KEY_OPTIONS = [
  { value: 'hero',              label: 'الهيرو (Hero)' },
  { value: 'featured_products', label: 'منتجات مميزة' },
  { value: 'categories_grid',   label: 'شبكة التصنيفات' },
  { value: 'promotions',        label: 'العروض والتخفيضات' },
  { value: 'loyalty_banner',    label: 'بانر الولاء' },
  { value: 'new_arrivals',      label: 'وصل حديثاً' },
];

function pickArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    for (const key of ['data', 'items', 'sections', 'homepage_sections']) {
      const c = obj[key];
      if (Array.isArray(c)) return c as T[];
    }
  }
  return [];
}

export default function HomepagePage() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);

  const [form, setForm] = useState({
    section_key: 'hero',
    title_ar:    '',
    title_en:    '',
    sort_order:  0,
    is_active:   true,
  });

  async function load() {
    setLoading(true);
    const res = await fetch('/api/catalog/homepage', { cache: 'no-store' });
    const payload = await res.json().catch(() => null);
    setSections(pickArray<HomeSection>(payload));
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.title_ar.trim()) { setError('العنوان بالعربية مطلوب'); return; }
    setError(''); setSaving(true);
    const res = await fetch('/api/catalog/homepage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section_key: form.section_key,
        title_ar:    form.title_ar.trim(),
        title_en:    form.title_en.trim() || form.title_ar.trim(),
        sort_order:  Number(form.sort_order),
        is_active:   form.is_active,
        content:     {},
      }),
    });
    if (!res.ok) {
      const p = await res.json().catch(() => null);
      setError((p as { error?: string } | null)?.error ?? 'فشل الحفظ');
    } else {
      setForm({ section_key: 'hero', title_ar: '', title_en: '', sort_order: 0, is_active: true });
      void load();
    }
    setSaving(false);
  }

  async function toggle(id: string, is_active: boolean) {
    await fetch(`/api/catalog/homepage/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !is_active }),
    });
    void load();
  }

  async function handleDelete(id: string) {
    if (!window.confirm('حذف هذا القسم؟')) return;
    await fetch(`/api/catalog/homepage/${id}`, { method: 'DELETE' });
    void load();
  }

  const inp = 'w-full rounded-2xl border border-[#E8DCC3] bg-[#FFFDF8] px-4 py-3 text-[#1F1B16] outline-none focus:border-[#C9A84C]';

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-3xl border border-[#E8DCC3] bg-[#FFFDF8] p-6 shadow-xl">
        <h1 className="text-3xl font-black text-[#1F1B16]">أقسام الصفحة الرئيسية</h1>
        <p className="mt-2 text-sm text-[#6F6658]">إدارة ترتيب وإظهار أقسام الواجهة الرئيسية للمتجر.</p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        {/* Sections List */}
        <section className="overflow-hidden rounded-3xl border border-[#E8DCC3] bg-[#FFFDF8] shadow-xl">
          {loading ? (
            <div className="p-10 text-center text-[#6F6658]">جار التحميل...</div>
          ) : sections.length === 0 ? (
            <div className="p-10 text-center text-[#6F6658]">لا توجد أقسام. أضف أول قسم من النموذج.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-[#C9A84C]">
                  <tr>
                    <th className="px-4 py-4 text-right font-black">المفتاح</th>
                    <th className="px-4 py-4 text-right font-black">العنوان</th>
                    <th className="px-4 py-4 text-right font-black">الترتيب</th>
                    <th className="px-4 py-4 text-right font-black">الحالة</th>
                    <th className="px-4 py-4 text-left font-black">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {sections.sort((a, b) => a.sort_order - b.sort_order).map(s => (
                    <tr key={s.id} className="text-[#1F1B16] hover:bg-[#FFFDF8]">
                      <td className="px-4 py-4 font-mono text-xs text-[#C9A84C]">{s.section_key}</td>
                      <td className="px-4 py-4 font-bold text-[#1F1B16]">{s.title_ar}</td>
                      <td className="px-4 py-4 text-[#6F6658]">{s.sort_order}</td>
                      <td className="px-4 py-4">
                        <button type="button" onClick={() => void toggle(s.id, s.is_active)}
                          className={['rounded-full border px-3 py-1 text-xs font-black', s.is_active ? 'border-green-400/20 bg-green-400/10 text-green-200' : 'border-[#E8DCC3] bg-white/5 text-[#6F6658]'].join(' ')}>
                          {s.is_active ? 'مرئي' : 'مخفي'}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-left">
                        <button type="button" onClick={() => void handleDelete(s.id)} className="text-xs font-black text-red-300 hover:text-red-200">حذف</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Add Section Form */}
        <aside className="rounded-3xl border border-[#E8DCC3] bg-[#FFFDF8] p-6 shadow-xl">
          <h2 className="mb-5 text-xl font-black text-[#1F1B16]">قسم جديد</h2>
          {error && <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>}
          <form onSubmit={e => void submit(e)} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-bold text-[#6F6658]">نوع القسم</span>
              <select value={form.section_key} onChange={e => setForm(f => ({ ...f, section_key: e.target.value }))} className={inp}>
                {SECTION_KEY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-[#6F6658]">العنوان بالعربية *</span>
              <input value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} placeholder="منتجاتنا المميزة" className={inp} />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-[#6F6658]">العنوان بالإنجليزية</span>
              <input value={form.title_en} onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))} placeholder="Our Featured Products" className={inp} />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-[#6F6658]">الترتيب</span>
              <input type="number" min="0" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))} className={inp} />
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-[#C9A84C] w-4 h-4" />
              <span className="text-sm text-[#6F6658]">مرئي في الصفحة الرئيسية</span>
            </label>
            <button type="submit" disabled={saving}
              className="w-full rounded-2xl bg-[#C9A84C] py-3 text-sm font-black text-[#111111] transition hover:bg-[#D8B95F] disabled:opacity-50">
              {saving ? 'جار الحفظ...' : 'إضافة القسم'}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}