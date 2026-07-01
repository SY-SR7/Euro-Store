'use client';

import { Plus, RefreshCw, Search, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';

type Brand = { id: string; name: string; slug: string | null; logo_url?: string | null; is_active: boolean | null };

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
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F8F6F2] text-[#57534E] hover:bg-[#E5E0D8]"><X size={17} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-[#F0ECE6] pb-2 last:border-0 last:pb-0 sm:grid-cols-[110px_minmax(0,1fr)]">
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

function ActivePills({ value, onSave }: { value: boolean; onSave: (value: boolean) => void | Promise<void> }) {
  const t = useTranslations('adminCatalog');
  return (
    <div className="flex gap-2">
      {[{ v: true, l: t('active', { fallback: 'مفعّل' }), c: 'border-green-200 bg-green-50 text-green-700' }, { v: false, l: t('inactive', { fallback: 'غير مفعّل' }), c: 'border-red-200 bg-red-50 text-red-700' }].map((option) => (
        <button key={option.l} type="button" onClick={() => option.v !== value && void onSave(option.v)} className={`rounded-full border px-3 py-1 text-xs font-black ${option.v === value ? option.c : 'border-[#E5E0D8] bg-[#FAF7EF] text-[#8B8172] hover:border-[#B8860B]'}`}>{option.l}</button>
      ))}
    </div>
  );
}

function fallbackSlug(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export default function BrandsQuickAdmin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Brand | null>(null);
  const [msg, setMsg] = useState('');
  const [autoOpenedId, setAutoOpenedId] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const t = useTranslations('adminCatalog');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isAr = locale === 'ar';

  const load = useCallback(() => {
    setLoading(true);
    fetchJson<Brand[]>('/api/catalog/brands', { cache: 'no-store' })
      .then((data) => setBrands(Array.isArray(data) ? data : []))
      .catch(() => setBrands([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openBrand = useCallback((brand: Brand, updateUrl = true) => {
    setSelected(brand);
    setMsg('');
    if (updateUrl) router.replace(`/brands?open=${brand.id}`, { scroll: false });
  }, [router]);

  const closeBrand = () => {
    setSelected(null);
    router.replace('/brands', { scroll: false });
  };

  useEffect(() => {
    const brandId = searchParams.get('open');
    if (!brandId || autoOpenedId === brandId || selected?.id === brandId) return;

    const existing = brands.find((brand) => brand.id === brandId);
    if (existing) {
      openBrand(existing, false);
      setAutoOpenedId(brandId);
      return;
    }

    fetchJson<Brand>(`/api/catalog/brands/${brandId}`)
      .then((brand) => {
        setBrands((current) => current.some((item) => item.id === brand.id) ? current : [brand, ...current]);
        openBrand(brand, false);
        setAutoOpenedId(brandId);
      })
      .catch((error) => setMsg(error instanceof Error ? error.message : tCommon('error', { fallback: 'حدث خطأ' })));
  }, [autoOpenedId, brands, openBrand, searchParams, selected?.id, tCommon]);

  const mergeBrand = (id: string, patch: Partial<Brand>) => {
    setBrands((current) => current.map((brand) => (brand.id === id ? { ...brand, ...patch } : brand)));
    setSelected((current) => (current?.id === id ? { ...current, ...patch } : current));
  };

  const patchBrand = async (brand: Brand, patch: Partial<Brand>) => {
    const previous = brand;
    setMsg('');
    mergeBrand(brand.id, patch);
    try {
      const updated = await fetchJson<Brand>(`/api/catalog/brands/${brand.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
      mergeBrand(brand.id, updated);
      setMsg(t('saveSuccess', { fallback: 'تم الحفظ بنجاح' }));
    } catch (error) {
      mergeBrand(previous.id, previous);
      setMsg(error instanceof Error ? error.message : t('saveFailed', { fallback: 'فشل الحفظ' }));
    }
  };

  const createBrand = async () => {
    if (!newName.trim()) return;
    await fetchJson<Brand>('/api/catalog/brands', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim(), slug: newSlug || fallbackSlug(newName), is_active: true }) });
    setNewName('');
    setNewSlug('');
    setShowCreate(false);
    load();
  };

  const visible = brands.filter((brand) => !search || brand.name.toLowerCase().includes(search.toLowerCase()) || (brand.slug ?? '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-black text-[#1C1917]">{t('brandsTitle', { fallback: 'إدارة العلامات التجارية' })}</h1><p className="mt-1 text-sm text-[#A8A29E]">{brands.length} {tCommon('items', { fallback: 'عنصر' })}</p></div>
        <div className="flex gap-2">
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#57534E] hover:border-[#B8860B]"><RefreshCw size={15} />{tCommon('refresh', { fallback: 'تحديث' })}</button>
          <button type="button" onClick={() => setShowCreate((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2 text-sm font-black text-white hover:bg-[#2D2926]"><Plus size={15} />{t('newBrand', { fallback: 'علامة تجارية جديدة' })}</button>
        </div>
      </div>

      {showCreate ? (
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('brandName', { fallback: 'الاسم' })} className={`${inputClass} flex-1`} dir={isAr ? "rtl" : "ltr"} />
            <input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder={t('brandSlug', { fallback: 'رابط العلامة' })} className={`${inputClass} flex-1`} dir="ltr" />
            <button type="button" onClick={() => void createBrand()} disabled={!newName.trim()} className="rounded-xl bg-[#B8860B] px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{t('saveBrand', { fallback: 'إضافة' })}</button>
          </div>
        </div>
      ) : null}

      <div className="flex overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm focus-within:border-[#B8860B]">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tCommon('searchPlaceholder', { fallback: 'بحث...' })} className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none" />
        <div className={`flex w-12 items-center justify-center ${isAr ? "border-r" : "border-l"} border-[#E5E0D8] text-[#8B8172]`}><Search size={17} /></div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? <p className="p-10 text-center text-sm text-[#A8A29E]">{tCommon('loading', { fallback: 'جار التحميل...' })}</p>
        : visible.length === 0 ? <p className="p-10 text-center text-sm text-[#A8A29E]">{t('noBrands', { fallback: 'لا توجد ماركات' })}</p>
        : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]"><tr>{[t('brandName', { fallback: 'الاسم' }),'Slug',t('status', { fallback: 'الحالة' })].map((h,i)=><th key={h} className={`px-5 py-3 ${isAr ? "text-right" : "text-left"} text-xs font-black text-[#A8A29E] ${i===1?'hidden sm:table-cell':''}`}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {visible.map((brand) => (
                  <tr key={brand.id} className="group cursor-pointer transition-colors hover:bg-[#FFFBF0]" onClick={() => openBrand(brand)}>
                    <td className="px-5 py-3 font-semibold text-[#1C1917] group-hover:text-[#B8860B]">{brand.name}</td>
                    <td className="hidden px-5 py-3 font-mono text-xs text-[#A8A29E] sm:table-cell">{brand.slug ?? ''}</td>
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => void patchBrand(brand, { is_active: !brand.is_active })} className={`rounded-full border px-3 py-1 text-xs font-bold ${brand.is_active ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{brand.is_active ? t('active', { fallback: 'مفعّل' }) : t('inactive', { fallback: 'غير مفعّل' })}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected ? (
        <Modal title={selected.name} onClose={closeBrand}>
          <div className="space-y-4">
            {msg ? <div className={`rounded-xl border px-4 py-2 text-sm font-bold ${msg === t('saveSuccess', { fallback: 'تم الحفظ بنجاح' }) ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{msg}</div> : null}
            <div className="rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
              <div className="space-y-2">
                <Field label={t('brandName', { fallback: 'الاسم' })}><InlineText value={selected.name} dir={isAr ? "rtl" : "ltr"} onSave={(name) => patchBrand(selected, { name })} /></Field>
                <Field label={t('brandSlug', { fallback: 'رابط العلامة' })}><InlineText value={selected.slug ?? ''} dir="ltr" onSave={(slug) => patchBrand(selected, { slug })} /></Field>
                <Field label={t('primaryImage', { fallback: 'الشعار' })}><InlineText value={selected.logo_url ?? ''} dir="ltr" onSave={(logo_url) => patchBrand(selected, { logo_url })} /></Field>
                <Field label={t('status', { fallback: 'الحالة' })}><ActivePills value={Boolean(selected.is_active)} onSave={(is_active) => patchBrand(selected, { is_active })} /></Field>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
