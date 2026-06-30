'use client';

import { Plus, RefreshCw, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

type Category = {
  id: string;
  name_ar: string | null;
  name_en: string | null;
  slug: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  image_url?: string | null;
};

const inputClass =
  'w-full rounded-xl border border-[#E5E0D8] bg-white px-3 py-2 text-sm text-[#1C1917] outline-none transition focus:border-[#B8860B]';

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

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-[#E5E0D8] bg-[#FFFCF7] shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] bg-white px-5 py-4">
          <h2 className="font-black text-[#1C1917]">{title}</h2>
          <button type="button" title="إغلاق" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F8F6F2] text-[#57534E] hover:bg-[#E5E0D8]"><X size={17} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-[#F0ECE6] pb-2 last:border-0 last:pb-0 sm:grid-cols-[120px_minmax(0,1fr)]">
      <span className="text-xs font-bold text-[#8B8172]">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function InlineText({ value, onSave, dir = 'rtl' }: { value?: string | null; onSave: (value: string) => void | Promise<void>; dir?: 'rtl' | 'ltr' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  useEffect(() => { if (!editing) setDraft(value ?? ''); }, [editing, value]);
  const commit = () => { const next = draft.trim(); setEditing(false); if (next !== (value ?? '')) void onSave(next); };
  if (editing) return <input autoFocus value={draft} dir={dir} onBlur={commit} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }} className={inputClass} />;
  return <button type="button" onClick={() => setEditing(true)} dir={dir} className="min-h-9 w-full rounded-xl px-3 py-2 text-start text-sm font-semibold text-[#1C1917] transition hover:bg-[#FAF7EF]">{value || <span className="text-[#A8A29E]">—</span>}</button>;
}

function InlineNumber({ value, onSave }: { value?: number | null; onSave: (value: number) => void | Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? 0));
  useEffect(() => { if (!editing) setDraft(String(value ?? 0)); }, [editing, value]);
  const commit = () => { const next = Number(draft); setEditing(false); if (Number.isFinite(next) && next !== (value ?? 0)) void onSave(next); };
  if (editing) return <input autoFocus type="number" value={draft} onBlur={commit} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }} className={inputClass} />;
  return <button type="button" onClick={() => setEditing(true)} className="min-h-9 w-full rounded-xl px-3 py-2 text-start text-sm font-bold text-[#1C1917] transition hover:bg-[#FAF7EF]">{value ?? 0}</button>;
}

function ActivePills({ value, onSave }: { value: boolean; onSave: (value: boolean) => void | Promise<void> }) {
  return (
    <div className="flex gap-2">
      {[{ v: true, l: 'نشط', c: 'border-green-200 bg-green-50 text-green-700' }, { v: false, l: 'غير نشط', c: 'border-red-200 bg-red-50 text-red-700' }].map((option) => (
        <button key={option.l} type="button" onClick={() => option.v !== value && void onSave(option.v)} className={`rounded-full border px-3 py-1 text-xs font-black ${option.v === value ? option.c : 'border-[#E5E0D8] bg-[#FAF7EF] text-[#8B8172] hover:border-[#B8860B]'}`}>{option.l}</button>
      ))}
    </div>
  );
}

export default function CategoriesQuickAdmin() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Category | null>(null);
  const [msg, setMsg] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newForm, setNewForm] = useState({ name_ar: '', name_en: '', slug: '', sort_order: '0' });

  const load = useCallback(() => {
    setLoading(true);
    fetchJson<Category[]>('/api/catalog/categories', { cache: 'no-store' })
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const mergeCategory = (id: string, patch: Partial<Category>) => {
    setCategories((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    setSelected((current) => (current?.id === id ? { ...current, ...patch } : current));
  };

  const patchCategory = async (category: Category, patch: Partial<Category>) => {
    const previous = category;
    setMsg('');
    mergeCategory(category.id, patch);
    try {
      const updated = await fetchJson<Category>(`/api/catalog/categories/${category.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
      mergeCategory(category.id, updated);
      setMsg('تم الحفظ');
    } catch (error) {
      mergeCategory(previous.id, previous);
      setMsg(error instanceof Error ? error.message : 'فشل الحفظ');
    }
  };

  const createCategory = async () => {
    if (!newForm.name_ar) return;
    await fetchJson<Category>('/api/catalog/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newForm, sort_order: Number(newForm.sort_order) || 0 }) });
    setNewForm({ name_ar: '', name_en: '', slug: '', sort_order: '0' });
    setShowCreate(false);
    load();
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-black text-[#1C1917]">التصنيفات</h1><p className="mt-1 text-sm text-[#A8A29E]">{categories.length} قسم</p></div>
        <div className="flex gap-2">
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#57534E] hover:border-[#B8860B]"><RefreshCw size={15} />تحديث</button>
          <button type="button" onClick={() => setShowCreate((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2 text-sm font-black text-white hover:bg-[#2D2926]"><Plus size={15} />قسم جديد</button>
        </div>
      </div>

      {showCreate ? (
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={newForm.name_ar} onChange={(e) => setNewForm((f) => ({ ...f, name_ar: e.target.value }))} placeholder="الاسم بالعربية" className={inputClass} />
            <input value={newForm.name_en} onChange={(e) => setNewForm((f) => ({ ...f, name_en: e.target.value }))} placeholder="الاسم بالإنجليزية" className={inputClass} dir="ltr" />
            <input value={newForm.slug} onChange={(e) => setNewForm((f) => ({ ...f, slug: e.target.value }))} placeholder="slug" className={inputClass} dir="ltr" />
            <input type="number" value={newForm.sort_order} onChange={(e) => setNewForm((f) => ({ ...f, sort_order: e.target.value }))} placeholder="الترتيب" className={inputClass} />
            <button type="button" onClick={() => void createCategory()} disabled={!newForm.name_ar} className="rounded-xl bg-[#B8860B] py-2 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2">إنشاء</button>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? <p className="p-10 text-center text-sm text-[#A8A29E]">جار التحميل...</p>
        : categories.length === 0 ? <p className="p-10 text-center text-sm text-[#A8A29E]">لا توجد تصنيفات</p>
        : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]"><tr>{['الاسم','Slug','الترتيب','الحالة'].map((h,i)=><th key={h} className={`px-5 py-3 text-right text-xs font-black text-[#A8A29E] ${i===1?'hidden sm:table-cell':''} ${i===2?'hidden md:table-cell':''}`}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {[...categories].sort((a,b)=>(a.sort_order??0)-(b.sort_order??0)).map((category) => (
                  <tr key={category.id} className="group cursor-pointer transition-colors hover:bg-[#FFFBF0]" onClick={() => { setSelected(category); setMsg(''); }}>
                    <td className="px-5 py-3 font-semibold text-[#1C1917] group-hover:text-[#B8860B]">{category.name_ar ?? ''}</td>
                    <td className="hidden px-5 py-3 font-mono text-xs text-[#A8A29E] sm:table-cell">{category.slug ?? ''}</td>
                    <td className="hidden px-5 py-3 text-[#57534E] md:table-cell">{category.sort_order ?? 0}</td>
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => void patchCategory(category, { is_active: !category.is_active })} className={`rounded-full border px-3 py-1 text-xs font-bold ${category.is_active ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{category.is_active ? 'نشط' : 'غير نشط'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected ? (
        <Modal title={selected.name_ar ?? 'قسم'} onClose={() => setSelected(null)}>
          <div className="space-y-4">
            {msg ? <div className={`rounded-xl border px-4 py-2 text-sm font-bold ${msg === 'تم الحفظ' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{msg}</div> : null}
            <div className="rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
              <div className="space-y-2">
                <Field label="الاسم العربي"><InlineText value={selected.name_ar ?? ''} onSave={(name_ar) => patchCategory(selected, { name_ar })} /></Field>
                <Field label="الاسم الإنجليزي"><InlineText value={selected.name_en ?? ''} dir="ltr" onSave={(name_en) => patchCategory(selected, { name_en })} /></Field>
                <Field label="الرابط"><InlineText value={selected.slug ?? ''} dir="ltr" onSave={(slug) => patchCategory(selected, { slug })} /></Field>
                <Field label="الصورة"><InlineText value={selected.image_url ?? ''} dir="ltr" onSave={(image_url) => patchCategory(selected, { image_url })} /></Field>
                <Field label="الترتيب"><InlineNumber value={selected.sort_order ?? 0} onSave={(sort_order) => patchCategory(selected, { sort_order })} /></Field>
                <Field label="الحالة"><ActivePills value={Boolean(selected.is_active)} onSave={(is_active) => patchCategory(selected, { is_active })} /></Field>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
