'use client';

import { Plus, RefreshCw, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';

type HomeSection = {
  id: string;
  section_key: string;
  title_ar: string;
  title_en: string | null;
  content?: Record<string, unknown> | null;
  is_active: boolean;
  sort_order: number;
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

function pickArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    for (const key of ['data', 'items', 'sections', 'homepage_sections']) {
      if (Array.isArray(record[key])) return record[key] as T[];
    }
  }
  return [];
}

function Modal({ title, onClose, children, closeTitle }: { title: string; onClose: () => void; children: ReactNode; closeTitle?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3" onClick={onClose}>
      <div className="flex max-h-[85dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#FFFCF7] shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] bg-background-card px-5 py-4">
          <h2 className="font-black text-text-primary">{title}</h2>
          <button type="button" title={closeTitle || "Close"} onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F8F6F2] text-text-secondary hover:bg-[#E5E0D8]">
            <X size={17} />
          </button>
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

function InlineText({
  value,
  onSave,
  dir = 'rtl',
  fallbackText = '-',
}: {
  value?: string | null;
  onSave: (value: string) => void | Promise<void>;
  dir?: 'rtl' | 'ltr';
  fallbackText?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');

  useEffect(() => {
    if (!editing) setDraft(value ?? '');
  }, [editing, value]);

  const commit = () => {
    const next = draft.trim();
    setEditing(false);
    if (next !== (value ?? '')) void onSave(next);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        dir={dir}
        onBlur={commit}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key === 'Enter') commit();
          if (event.key === 'Escape') setEditing(false);
        }}
        className={inputClass}
      />
    );
  }

  return (
    <button type="button" onClick={() => setEditing(true)} dir={dir} className="min-h-9 w-full rounded-xl px-3 py-2 text-start text-sm font-semibold text-text-primary transition hover:bg-background">
      {value || <span className="text-text-muted">{fallbackText}</span>}
    </button>
  );
}

function InlineNumber({ value, onSave }: { value: number; onSave: (value: number) => void | Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [editing, value]);

  const commit = () => {
    const next = Number(draft);
    setEditing(false);
    if (Number.isFinite(next) && next !== value) void onSave(next);
  };

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        value={draft}
        onBlur={commit}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit();
          if (event.key === 'Escape') setEditing(false);
        }}
        className={inputClass}
      />
    );
  }

  return (
    <button type="button" onClick={() => setEditing(true)} className="min-h-9 w-full rounded-xl px-3 py-2 text-start text-sm font-bold text-text-primary transition hover:bg-background">
      {value}
    </button>
  );
}

function OptionPills({ value, options, onSave }: { value: string; options: { value: string; label: string }[]; onSave: (value: string) => void | Promise<void> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => option.value !== value && void onSave(option.value)}
          className={`rounded-full border px-3 py-1 text-xs font-black ${option.value === value ? 'border-primary bg-primary text-text-primary' : 'border-[#E5E0D8] bg-background text-[#8B8172] hover:border-primary'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ActivePills({ value, onSave, labelVisible, labelHidden }: { value: boolean; onSave: (value: boolean) => void | Promise<void>; labelVisible: string; labelHidden: string }) {
  return (
    <div className="flex gap-2">
      {[{ v: true, l: labelVisible, c: 'border-green-200 bg-green-50 text-green-700' }, { v: false, l: labelHidden, c: 'border-red-200 bg-red-50 text-red-700' }].map((option) => (
        <button key={option.l} type="button" onClick={() => option.v !== value && void onSave(option.v)} className={`rounded-full border px-3 py-1 text-xs font-black ${option.v === value ? option.c : 'border-[#E5E0D8] bg-background text-[#8B8172] hover:border-primary'}`}>
          {option.l}
        </button>
      ))}
    </div>
  );
}

export default function HomepageQuickAdmin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const isAr = locale === 'ar';
  const t = useTranslations('adminHomepage');
  const tCommon = useTranslations('common');

  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<HomeSection | null>(null);
  const [msg, setMsg] = useState('');
  const [autoOpenedId, setAutoOpenedId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newForm, setNewForm] = useState({ section_key: 'hero', title_ar: '', title_en: '', sort_order: '0' });

  const SECTION_OPTIONS = [
    { value: 'hero', label: t('sectionKeyHero', { fallback: 'Hero' }) },
    { value: 'featured_products', label: t('sectionKeyFeatured', { fallback: 'منتجات مميزة' }) },
    { value: 'category_grid', label: t('sectionKeyCategories', { fallback: 'شبكة التصنيفات' }) },
    { value: 'promotions', label: t('sectionKeyPromotions', { fallback: 'العروض' }) },
    { value: 'loyalty_banner', label: t('sectionKeyLoyalty', { fallback: 'الولاء' }) },
    { value: 'new_arrivals', label: t('sectionKeyNewArrivals', { fallback: 'وصل حديثا' }) },
  ];

  const load = useCallback(() => {
    setLoading(true);
    fetchJson<unknown>('/api/catalog/homepage', { cache: 'no-store' })
      .then((payload) => setSections(pickArray<HomeSection>(payload)))
      .catch(() => setSections([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openSection = useCallback((section: HomeSection, updateUrl = true) => {
    setSelected(section);
    setMsg('');
    if (updateUrl) router.replace(`/homepage?open=${section.id}`, { scroll: false });
  }, [router]);

  const closeSection = () => {
    setSelected(null);
    router.replace('/homepage', { scroll: false });
  };

  useEffect(() => {
    const sectionId = searchParams.get('open');
    if (!sectionId || autoOpenedId === sectionId || selected?.id === sectionId) return;

    const existing = sections.find((section) => section.id === sectionId);
    if (existing) {
      openSection(existing, false);
      setAutoOpenedId(sectionId);
      return;
    }

    fetchJson<HomeSection>(`/api/catalog/homepage/${sectionId}`)
      .then((section) => {
        setSections((current) => current.some((item) => item.id === section.id) ? current : [section, ...current]);
        openSection(section, false);
        setAutoOpenedId(sectionId);
      })
      .catch((error) => setMsg(error instanceof Error ? error.message : t('failedToLoadSection', { fallback: 'تعذر فتح القسم' })));
  }, [autoOpenedId, openSection, searchParams, sections, selected?.id, t]);

  const mergeSection = (id: string, patch: Partial<HomeSection>) => {
    setSections((current) => current.map((section) => (section.id === id ? { ...section, ...patch } : section)));
    setSelected((current) => (current?.id === id ? { ...current, ...patch } : current));
  };

  const patchSection = async (section: HomeSection, patch: Partial<HomeSection>) => {
    const previous = section;
    setMsg('');
    mergeSection(section.id, patch);
    try {
      const updated = await fetchJson<HomeSection>(`/api/catalog/homepage/${section.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      mergeSection(section.id, updated);
      setMsg(tCommon('saved', { fallback: 'تم الحفظ' }));
    } catch (error) {
      mergeSection(previous.id, previous);
      setMsg(error instanceof Error ? error.message : tCommon('saveFailed', { fallback: 'فشل الحفظ' }));
    }
  };

  const createSection = async () => {
    if (!newForm.title_ar.trim()) return;
    try {
      await fetchJson<HomeSection>('/api/catalog/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_key: newForm.section_key,
          title_ar: newForm.title_ar.trim(),
          title_en: newForm.title_en.trim() || newForm.title_ar.trim(),
          sort_order: Number(newForm.sort_order) || 0,
          is_active: true,
          content: {},
        }),
      });
      setNewForm({ section_key: 'hero', title_ar: '', title_en: '', sort_order: '0' });
      setShowCreate(false);
      load();
    } catch (error) {
      setMsg(error instanceof Error ? error.message : tCommon('saveFailed', { fallback: 'فشل الحفظ' }));
    }
  };

  const deleteSection = async (section: HomeSection) => {
    if (!confirm(t('confirmDelete', { fallback: 'حذف هذا القسم؟' }))) return;
    try {
      await fetchJson<{ deleted: boolean }>(`/api/catalog/homepage/${section.id}`, { method: 'DELETE' });
      closeSection();
      load();
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'فشل الحذف');
    }
  };

  return (
    <div className="space-y-5" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E0D8] bg-background-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-primary">{t('homepageTitle', { fallback: 'الواجهة الرئيسية' })}</h1>
          <p className="mt-1 text-sm text-text-muted">{t('sectionsCount', { count: sections.length, fallback: `${sections.length} قسم` })}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-text-secondary hover:border-primary">
            <RefreshCw size={15} />{tCommon('refresh', { fallback: 'تحديث' })}
          </button>
          <button type="button" onClick={() => setShowCreate((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2 text-sm font-black text-white hover:bg-[#2D2926]">
            <Plus size={15} />{t('newSection', { fallback: 'قسم جديد' })}
          </button>
        </div>
      </div>

      {showCreate ? (
        <div className="rounded-2xl border border-[#E5E0D8] bg-background-card p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-4">
            <select value={newForm.section_key} onChange={(event) => setNewForm((form) => ({ ...form, section_key: event.target.value }))} className={inputClass} dir={isAr ? "rtl" : "ltr"}>
              {SECTION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <input value={newForm.title_ar} onChange={(event) => setNewForm((form) => ({ ...form, title_ar: event.target.value }))} placeholder={t('titleAr', { fallback: 'العنوان العربي' })} className={inputClass} dir="rtl" />
            <input value={newForm.title_en} onChange={(event) => setNewForm((form) => ({ ...form, title_en: event.target.value }))} placeholder={t('titleEn', { fallback: 'العنوان الإنجليزي' })} className={inputClass} dir="ltr" />
            <input type="number" value={newForm.sort_order} onChange={(event) => setNewForm((form) => ({ ...form, sort_order: event.target.value }))} placeholder={t('sortOrder', { fallback: 'الترتيب' })} className={inputClass} />
            <button type="button" onClick={() => void createSection()} disabled={!newForm.title_ar.trim()} className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-text-primary disabled:opacity-50 md:col-span-4">
              {t('addBtn', { fallback: 'إضافة' })}
            </button>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-background-card shadow-sm">
        {loading ? <p className="p-4 md:p-10 text-center text-sm text-text-muted">{tCommon('loading', { fallback: 'جار التحميل...' })}</p>
        : sections.length === 0 ? <p className="p-4 md:p-10 text-center text-sm text-text-muted">{t('noSections', { fallback: 'لا توجد أقسام' })}</p>
        : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]">
                <tr>{[t('section', { fallback: 'القسم' }), t('title', { fallback: 'العنوان' }), t('sortOrder', { fallback: 'الترتيب' }), t('status', { fallback: 'الحالة' })].map((head, index) => <th key={head} className={`px-5 py-3 ${isAr ? "text-right" : "text-left"} text-xs font-black text-text-muted ${index === 0 ? 'hidden sm:table-cell' : ''}`}>{head}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {[...sections].sort((a, b) => a.sort_order - b.sort_order).map((section) => (
                  <tr key={section.id} className="group cursor-pointer transition-colors hover:bg-[#FFFBF0]" onClick={() => openSection(section)}>
                    <td className="hidden px-5 py-3 font-mono text-xs text-text-muted sm:table-cell">{SECTION_OPTIONS.find(o => o.value === section.section_key)?.label || section.section_key}</td>
                    <td className="px-5 py-3 font-semibold text-text-primary group-hover:text-primary">{locale === 'ar' ? section.title_ar : (section.title_en || section.title_ar)}</td>
                    <td className="px-5 py-3 text-text-secondary">{section.sort_order}</td>
                    <td className="px-5 py-3" onClick={(event) => event.stopPropagation()}>
                      <button type="button" onClick={() => void patchSection(section, { is_active: !section.is_active })} className={`rounded-full border px-3 py-1 text-xs font-bold ${section.is_active ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                        {section.is_active ? t('statusVisible', { fallback: 'مرئي' }) : t('statusHidden', { fallback: 'مخفي' })}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected ? (
        <Modal title={locale === 'ar' ? selected.title_ar : (selected.title_en || selected.title_ar)} onClose={closeSection} closeTitle={tCommon('close', { fallback: 'إغلاق' })}>
          <div className="space-y-4">
            {msg ? <div className={`rounded-xl border px-4 py-2 text-sm font-bold ${msg === tCommon('saved', { fallback: 'تم الحفظ' }) ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{msg}</div> : null}
            <div className="rounded-2xl border border-[#E5E0D8] bg-background-card p-4 shadow-sm">
              <div className="space-y-2">
                <Field label={t('sectionType', { fallback: 'نوع القسم' })}><OptionPills value={selected.section_key} options={SECTION_OPTIONS} onSave={(section_key) => patchSection(selected, { section_key })} /></Field>
                <Field label={t('titleAr', { fallback: 'العنوان العربي' })}><InlineText value={selected.title_ar} dir="rtl" onSave={(title_ar) => patchSection(selected, { title_ar })} /></Field>
                <Field label={t('titleEn', { fallback: 'العنوان الإنجليزي' })}><InlineText value={selected.title_en ?? ''} dir="ltr" onSave={(title_en) => patchSection(selected, { title_en })} /></Field>
                <Field label={t('sortOrder', { fallback: 'الترتيب' })}><InlineNumber value={selected.sort_order} onSave={(sort_order) => patchSection(selected, { sort_order })} /></Field>
                <Field label={t('status', { fallback: 'الحالة' })}><ActivePills value={selected.is_active} labelVisible={t('statusVisible', { fallback: 'مرئي' })} labelHidden={t('statusHidden', { fallback: 'مخفي' })} onSave={(is_active) => patchSection(selected, { is_active })} /></Field>
              </div>
            </div>
            <button type="button" onClick={() => void deleteSection(selected)} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50">
              {t('deleteSection', { fallback: 'حذف القسم' })}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
