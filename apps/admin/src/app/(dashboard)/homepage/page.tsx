'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import HomepageQuickAdmin from './HomepageQuickAdmin';

export default HomepageQuickAdmin;

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

function Modal({ title, onClose, children }: { title:string; onClose:()=>void; children:React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl border border-[#E5E0D8] bg-white shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] px-6 py-4">
          <h2 className="font-black text-[#1C1917]">{title}</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F8F6F2] text-[#A8A29E] hover:bg-[#E5E0D8] text-lg">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function LegacyHomepagePage() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);
  const [selected, setSelected] = useState<HomeSection|null>(null);
  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState<Partial<HomeSection>>({});
  const [msg, setMsg]           = useState('');

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

  function open(s: HomeSection) { setSelected(s); setEditing(false); setDraft({}); setMsg(''); }

  async function toggle(s: HomeSection) {
    const next = !s.is_active;
    setSections(list => list.map(x => x.id===s.id ? {...x, is_active:next} : x));
    if (selected?.id === s.id) setSelected({...s, is_active:next});
    const res = await fetch(`/api/catalog/homepage/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: next }),
    });
    if (!res.ok) {
      setSections(list => list.map(x => x.id===s.id ? {...x, is_active:s.is_active} : x));
      if (selected?.id === s.id) setSelected({...s, is_active:s.is_active});
    }
  }

  async function saveEdit() {
    if (!selected) return;
    setSaving(true); setMsg('');
    const res = await fetch(`/api/catalog/homepage/${selected.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft),
    });
    if (res.ok) {
      const u = { ...selected, ...draft } as HomeSection;
      setSelected(u); setSections(list => list.map(x => x.id===selected.id ? u : x));
      setMsg('✓ تم الحفظ'); setEditing(false);
    } else { setMsg('✗ فشل الحفظ'); }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!window.confirm('حذف هذا القسم؟')) return;
    await fetch(`/api/catalog/homepage/${id}`, { method: 'DELETE' });
    setSelected(null);
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
                <thead className="bg-[#F8F4E9] text-[#6F6658]">
                  <tr>
                    <th className="px-4 py-4 text-right font-black">المفتاح</th>
                    <th className="px-4 py-4 text-right font-black">العنوان</th>
                    <th className="px-4 py-4 text-right font-black">الترتيب</th>
                    <th className="px-4 py-4 text-right font-black">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E9D8]">
                  {sections.sort((a, b) => a.sort_order - b.sort_order).map(s => (
                    <tr key={s.id} className="group cursor-pointer text-[#1F1B16] hover:bg-[#FFFBF0] transition-colors" onClick={()=>open(s)}>
                      <td className="px-4 py-4 font-mono text-xs text-[#C9A84C]">{s.section_key}</td>
                      <td className="px-4 py-4 font-bold text-[#1F1B16] group-hover:text-[#B8860B]">{s.title_ar}</td>
                      <td className="px-4 py-4 text-[#6F6658]">{s.sort_order}</td>
                      <td className="px-4 py-4" onClick={e=>{e.stopPropagation(); void toggle(s);}}>
                        <span className={['cursor-pointer rounded-full border px-3 py-1 text-xs font-black transition-colors', s.is_active ? 'border-green-200 bg-green-50 text-green-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700' : 'border-red-200 bg-red-50 text-red-700 hover:border-green-200 hover:bg-green-50 hover:text-green-700'].join(' ')}>
                          {s.is_active ? 'مرئي' : 'مخفي'}
                        </span>
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
          {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
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

      {selected && (
        <Modal title={selected.title_ar} onClose={()=>setSelected(null)}>
          {msg && <div className={`mb-4 rounded-xl px-4 py-2 text-sm ${msg.startsWith('✓')?'bg-green-50 text-green-700 border border-green-200':'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}
          {editing ? (
            <div className="space-y-3">
              <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">العنوان بالعربية</label>
                <input value={String(draft.title_ar ?? selected.title_ar)} onChange={e=>setDraft(d=>({...d, title_ar:e.target.value}))} className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]" />
              </div>
              <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">العنوان بالإنجليزية</label>
                <input value={String(draft.title_en ?? selected.title_en ?? '')} onChange={e=>setDraft(d=>({...d, title_en:e.target.value}))} dir="ltr" className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]" />
              </div>
              <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">الترتيب</label>
                <input type="number" value={String(draft.sort_order ?? selected.sort_order)} onChange={e=>setDraft(d=>({...d, sort_order:Number(e.target.value)}))} className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={saveEdit} disabled={saving} className="flex-1 rounded-xl bg-[#B8860B] py-2 text-sm font-bold text-white disabled:opacity-50">{saving?'...':'حفظ'}</button>
                <button onClick={()=>setEditing(false)} className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#57534E]">إلغاء</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">المفتاح</span><span className="font-mono text-xs font-semibold text-[#1C1917]">{selected.section_key}</span></div>
              <div className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">العنوان (عربي)</span><span className="font-semibold text-[#1C1917]">{selected.title_ar}</span></div>
              <div className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">العنوان (إنجليزي)</span><span className="font-semibold text-[#1C1917]" dir="ltr">{selected.title_en ?? ''}</span></div>
              <div className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">الترتيب</span><span className="font-semibold text-[#1C1917]">{selected.sort_order}</span></div>
              <div className="flex items-center justify-between border-b border-[#F0ECE6] pb-2">
                <span className="text-[#A8A29E]">الحالة</span>
                <button onClick={()=>void toggle(selected)} className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${selected.is_active?'bg-[#B8860B]':'bg-gray-300'}`}>
                  <span className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${selected.is_active?'translate-x-[-1.375rem]':'translate-x-[-0.125rem]'}`}/>
                </button>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={()=>{ setDraft({...selected}); setEditing(true); }} className="flex-1 rounded-xl border border-[#B8860B] py-2 text-sm font-bold text-[#B8860B] hover:bg-[#B8860B]/10">✎ تعديل</button>
                <button onClick={()=>void handleDelete(selected.id)} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50">حذف</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
