'use client';

import { Plus, RefreshCw, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';

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
  'w-full rounded-xl border border-[#E5E0D8] bg-background-card px-3 py-2 text-sm text-text-primary outline-none transition focus:border-primary';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  
  if (res.status === 401) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً');
  }
  
  const payload = (await res.json().catch(() => null)) as T | { error?: string } | null;
  if (!res.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && payload.error
        ? (payload.error === 'Unauthorized' ? 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً' : String(payload.error))
        : 'request_failed';
    throw new Error(message);
  }
  return payload as T;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3" onClick={onClose}>
      <div className="flex max-h-[85dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#FFFCF7] shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] bg-background-card px-5 py-4">
          <h2 className="font-black text-text-primary">{title}</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F8F6F2] text-text-secondary hover:bg-[#E5E0D8]"><X size={17} /></button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
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
  return <button type="button" onClick={() => setEditing(true)} dir={dir} className="min-h-9 w-full rounded-xl px-3 py-2 text-start text-sm font-semibold text-text-primary transition hover:bg-background">{value || <span className="text-text-muted">—</span>}</button>;
}

function InlineNumber({ value, onSave }: { value?: number | null; onSave: (value: number) => void | Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? 0));
  useEffect(() => { if (!editing) setDraft(String(value ?? 0)); }, [editing, value]);
  const commit = () => { const next = Number(draft); setEditing(false); if (Number.isFinite(next) && next !== (value ?? 0)) void onSave(next); };
  if (editing) return <input autoFocus type="number" value={draft} onBlur={commit} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }} className={inputClass} />;
  return <button type="button" onClick={() => setEditing(true)} className="min-h-9 w-full rounded-xl px-3 py-2 text-start text-sm font-bold text-text-primary transition hover:bg-background">{value ?? 0}</button>;
}

function ActivePills({ value, onSave }: { value: boolean; onSave: (value: boolean) => void | Promise<void> }) {
  const t = useTranslations('adminCatalog');
  return (
    <div className="flex gap-2">
      {[{ v: true, l: t('active', { fallback: 'مفعّل' }), c: 'border-green-200 bg-green-50 text-green-700' }, { v: false, l: t('inactive', { fallback: 'غير مفعّل' }), c: 'border-red-200 bg-red-50 text-red-700' }].map((option) => (
        <button key={option.l} type="button" onClick={() => option.v !== value && void onSave(option.v)} className={`rounded-full border px-3 py-1 text-xs font-black ${option.v === value ? option.c : 'border-[#E5E0D8] bg-background text-[#8B8172] hover:border-primary'}`}>{option.l}</button>
      ))}
    </div>
  );
}

export default function CategoriesQuickAdmin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Category | null>(null);
  const [msg, setMsg] = useState('');
  const [autoOpenedId, setAutoOpenedId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newForm, setNewForm] = useState({ name_ar: '', name_en: '', slug: '', sort_order: '0' });
  const t = useTranslations('adminCatalog');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isAr = locale === 'ar';

  const load = useCallback(() => {
    setLoading(true);
    fetchJson<Category[]>('/api/catalog/categories', { cache: 'no-store' })
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCategory = useCallback((category: Category, updateUrl = true) => {
    setSelected(category);
    setMsg('');
    if (updateUrl) router.replace(`/categories?open=${category.id}`, { scroll: false });
  }, [router]);

  const closeCategory = () => {
    setSelected(null);
    router.replace('/categories', { scroll: false });
  };

  useEffect(() => {
    const categoryId = searchParams.get('open');
    if (!categoryId || autoOpenedId === categoryId || selected?.id === categoryId) return;

    const existing = categories.find((category) => category.id === categoryId);
    if (existing) {
      openCategory(existing, false);
      setAutoOpenedId(categoryId);
      return;
    }

    fetchJson<Category>(`/api/catalog/categories/${categoryId}`)
      .then((category) => {
        setCategories((current) => current.some((item) => item.id === category.id) ? current : [category, ...current]);
        openCategory(category, false);
        setAutoOpenedId(categoryId);
      })
      .catch((error) => setMsg(error instanceof Error ? error.message : tCommon('error', { fallback: 'حدث خطأ' })));
  }, [autoOpenedId, categories, openCategory, searchParams, selected?.id, tCommon]);

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
      setMsg(t('saveSuccess', { fallback: 'تم الحفظ بنجاح' }));
    } catch (error) {
      mergeCategory(previous.id, previous);
      setMsg(error instanceof Error ? error.message : t('saveFailed', { fallback: 'فشل الحفظ' }));
    }
  };

  const createCategory = async () => {
    if (!newForm.name_ar) return;
    const finalNameEn = newForm.name_en.trim() || newForm.name_ar.trim();
    const generatedSlug = newForm.name_en.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const finalSlug = newForm.slug.trim() || generatedSlug || `cat-${Math.random().toString(36).substring(2, 8)}`;

    await fetchJson<Category>('/api/catalog/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newForm, name_en: finalNameEn, slug: finalSlug, sort_order: Number(newForm.sort_order) || 0 }) });
    setNewForm({ name_ar: '', name_en: '', slug: '', sort_order: '0' });
    setShowCreate(false);
    load();
  };

  return (
    <div className="space-y-5" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E0D8] bg-background-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-black text-text-primary">{t('categoriesTitle', { fallback: 'إدارة التصنيفات' })}</h1><p className="mt-1 text-sm text-text-muted">{categories.length} {tCommon('items', { fallback: 'عنصر' })}</p></div>
        <div className="flex gap-2">
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-text-secondary hover:border-primary"><RefreshCw size={15} />{tCommon('refresh', { fallback: 'تحديث' })}</button>
          <button type="button" onClick={() => setShowCreate((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2 text-sm font-black text-white hover:bg-[#2D2926]"><Plus size={15} />{t('newCategory', { fallback: 'تصنيف جديد' })}</button>
        </div>
      </div>

      {showCreate ? (
        <div className="rounded-2xl border border-[#E5E0D8] bg-background-card p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={newForm.name_ar} onChange={(e) => setNewForm((f) => ({ ...f, name_ar: e.target.value }))} placeholder={t('categoryNameAr', { fallback: 'الاسم بالعربية' })} className={inputClass} />
            <input value={newForm.name_en} onChange={(e) => setNewForm((f) => ({ ...f, name_en: e.target.value }))} placeholder={t('categoryNameEn', { fallback: 'الاسم بالإنجليزية' })} className={inputClass} dir="ltr" />
            <input value={newForm.slug} onChange={(e) => setNewForm((f) => ({ ...f, slug: e.target.value }))} placeholder={t('categorySlug', { fallback: 'الرابط' })} className={inputClass} dir="ltr" />
            <input type="number" value={newForm.sort_order} onChange={(e) => setNewForm((f) => ({ ...f, sort_order: e.target.value }))} placeholder={t('position', { fallback: 'الترتيب' })} className={inputClass} />
            <button type="button" onClick={() => void createCategory()} disabled={!newForm.name_ar} className="rounded-xl bg-primary py-2 text-sm font-bold text-text-primary disabled:opacity-50 sm:col-span-2">{t('saveCategory', { fallback: 'حفظ التصنيف' })}</button>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-background-card shadow-sm">
        {loading ? <p className="p-4 md:p-10 text-center text-sm text-text-muted">{tCommon('loading', { fallback: 'جار التحميل...' })}</p>
        : categories.length === 0 ? <p className="p-4 md:p-10 text-center text-sm text-text-muted">{t('noCategories', { fallback: 'لا توجد تصنيفات' })}</p>
        : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]"><tr>{[t('categoryNameAr', { fallback: 'الاسم بالعربية' }),'Slug',t('position', { fallback: 'الترتيب' }),t('status', { fallback: 'الحالة' })].map((h,i)=><th key={h} className={`px-5 py-3 ${isAr ? "text-right" : "text-left"} text-xs font-black text-text-muted ${i===1?'hidden sm:table-cell':''} ${i===2?'hidden md:table-cell':''}`}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {[...categories].sort((a,b)=>(a.sort_order??0)-(b.sort_order??0)).map((category) => (
                  <tr key={category.id} className="group cursor-pointer transition-colors hover:bg-[#FFFBF0]" onClick={() => openCategory(category)}>
                    <td className="px-5 py-3 font-semibold text-text-primary group-hover:text-primary">{isAr ? category.name_ar : (category.name_en || category.name_ar)}</td>
                    <td className="hidden px-5 py-3 font-mono text-xs text-text-muted sm:table-cell">{category.slug ?? ''}</td>
                    <td className="hidden px-5 py-3 text-text-secondary md:table-cell">{category.sort_order ?? 0}</td>
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => void patchCategory(category, { is_active: !category.is_active })} className={`rounded-full border px-3 py-1 text-xs font-bold ${category.is_active ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{category.is_active ? t('active', { fallback: 'مفعّل' }) : t('inactive', { fallback: 'غير مفعّل' })}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected ? (
        <Modal title={isAr ? (selected.name_ar ?? 'قسم') : (selected.name_en || selected.name_ar || 'Category')} onClose={closeCategory}>
          <div className="space-y-4">
            {msg ? <div className={`rounded-xl border px-4 py-2 text-sm font-bold ${msg === t('saveSuccess', { fallback: 'تم الحفظ بنجاح' }) ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{msg}</div> : null}
            <div className="rounded-2xl border border-[#E5E0D8] bg-background-card p-4 shadow-sm">
              <div className="space-y-2">
                <Field label={t('categoryNameAr', { fallback: 'الاسم بالعربية' })}><InlineText value={selected.name_ar ?? ''} dir={isAr ? "rtl" : "ltr"} onSave={(name_ar) => patchCategory(selected, { name_ar })} /></Field>
                <Field label={t('categoryNameEn', { fallback: 'الاسم بالإنجليزية' })}><InlineText value={selected.name_en ?? ''} dir="ltr" onSave={(name_en) => patchCategory(selected, { name_en })} /></Field>
                <Field label={t('categorySlug', { fallback: 'الرابط' })}><InlineText value={selected.slug ?? ''} dir="ltr" onSave={(slug) => patchCategory(selected, { slug })} /></Field>
                <Field label={t('primaryImage', { fallback: 'صورة رئيسية' })}><InlineText value={selected.image_url ?? ''} dir="ltr" onSave={(image_url) => patchCategory(selected, { image_url })} /></Field>
                <Field label={t('position', { fallback: 'الترتيب' })}><InlineNumber value={selected.sort_order ?? 0} onSave={(sort_order) => patchCategory(selected, { sort_order })} /></Field>
                <Field label={t('status', { fallback: 'الحالة' })}><ActivePills value={Boolean(selected.is_active)} onSave={(is_active) => patchCategory(selected, { is_active })} /></Field>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
