'use client';

import { Plus, RefreshCw, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';

type Discount = {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | string;
  value: number;
  min_order_syp?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
  max_uses?: number | null;
  used_count?: number | null;
  is_active: boolean;
};

const inputClass =
  'w-full rounded-xl border border-[#E5E0D8] bg-white px-3 py-2 text-sm text-[#1C1917] outline-none transition focus:border-[#B8860B]';

function money(value?: number | null, locale = 'ar-SY') {
  const currencySymbol = locale === 'ar' ? 'ل.س' : 'SYP';
  return `${Number(value || 0).toLocaleString(locale)} ${currencySymbol}`;
}

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

function Modal({ title, onClose, children, closeTitle }: { title: string; onClose: () => void; children: ReactNode; closeTitle?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-[#E5E0D8] bg-[#FFFCF7] shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] bg-white px-5 py-4">
          <h2 className="font-black text-[#1C1917]">{title}</h2>
          <button type="button" title={closeTitle || "Close"} onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F8F6F2] text-[#57534E] hover:bg-[#E5E0D8]">
            <X size={17} />
          </button>
        </div>
        <div className="max-h-[78vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-[#F0ECE6] pb-2 last:border-0 last:pb-0 sm:grid-cols-[130px_minmax(0,1fr)]">
      <span className="text-xs font-bold text-[#8B8172]">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function InlineText({ value, onSave, dir = 'rtl' }: { value?: string | null; onSave: (value: string) => void | Promise<void>; dir?: 'rtl' | 'ltr' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  useEffect(() => { if (!editing) setDraft(value ?? ''); }, [editing, value]);
  const commit = () => {
    const next = draft.trim();
    setEditing(false);
    if (next !== (value ?? '')) void onSave(next);
  };
  if (editing) return <input autoFocus value={draft} dir={dir} onBlur={commit} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }} className={inputClass} />;
  return <button type="button" onClick={() => setEditing(true)} dir={dir} className="min-h-9 w-full rounded-xl px-3 py-2 text-start text-sm font-semibold text-[#1C1917] transition hover:bg-[#FAF7EF]">{value || <span className="text-[#A8A29E]">—</span>}</button>;
}

function InlineNumber({ value, onSave, nullable = false, locale = 'ar-SY' }: { value?: number | null; onSave: (value: number | null) => void | Promise<void>; nullable?: boolean; locale?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value == null ? '' : String(value));
  useEffect(() => { if (!editing) setDraft(value == null ? '' : String(value)); }, [editing, value]);
  const commit = () => {
    const trimmed = draft.trim();
    setEditing(false);
    if (!trimmed && nullable) { if (value !== null) void onSave(null); return; }
    const next = Number(trimmed);
    if (Number.isFinite(next) && next !== (value ?? null)) void onSave(next);
  };
  if (editing) return <input autoFocus type="number" value={draft} onBlur={commit} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }} className={inputClass} />;
  return <button type="button" onClick={() => setEditing(true)} className="min-h-9 w-full rounded-xl px-3 py-2 text-start text-sm font-bold text-[#1C1917] transition hover:bg-[#FAF7EF]">{value == null ? <span className="text-[#A8A29E]">—</span> : Number(value).toLocaleString(locale)}</button>;
}

function TypePills({ value, onSave, t }: { value: string; onSave: (value: string) => void | Promise<void>; t: any }) {
  return (
    <div className="flex gap-2">
      {[['percentage', t('typePercentage', { fallback: 'نسبة %' })], ['fixed', t('typeFixed', { fallback: 'مبلغ ثابت' })]].map(([key, label]) => (
        <button key={key} type="button" onClick={() => key !== value && void onSave(key)} className={`rounded-full border px-3 py-1 text-xs font-black ${key === value ? 'border-[#B8860B] bg-[#FFF4D8] text-[#1C1917]' : 'border-[#E5E0D8] bg-[#FAF7EF] text-[#8B8172] hover:border-[#B8860B]'}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

function ActivePills({ value, onSave, t }: { value: boolean; onSave: (value: boolean) => void | Promise<void>; t: any }) {
  return (
    <div className="flex gap-2">
      {[{ v: true, l: t('statusActive', { fallback: 'نشط' }), c: 'border-green-200 bg-green-50 text-green-700' }, { v: false, l: t('statusInactive', { fallback: 'معطّل' }), c: 'border-red-200 bg-red-50 text-red-700' }].map((option) => (
        <button key={option.l} type="button" onClick={() => option.v !== value && void onSave(option.v)} className={`rounded-full border px-3 py-1 text-xs font-black ${option.v === value ? option.c : 'border-[#E5E0D8] bg-[#FAF7EF] text-[#8B8172] hover:border-[#B8860B]'}`}>
          {option.l}
        </button>
      ))}
    </div>
  );
}

function toDateInput(value?: string | null) {
  return value ? value.substring(0, 10) : '';
}

function formatDate(value?: string | null, locale = 'ar-SY') {
  return value ? new Date(value).toLocaleDateString(locale) : '—';
}

export default function DiscountsQuickAdmin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const isAr = locale === 'ar';
  const t = useTranslations('adminDiscounts');
  const tCommon = useTranslations('common');

  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Discount | null>(null);
  const [msg, setMsg] = useState('');
  const [autoOpenedId, setAutoOpenedId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newForm, setNewForm] = useState({ code: '', type: 'percentage', value: '', min_order_syp: '', valid_from: '', valid_until: '', max_uses: '' });

  const load = useCallback(() => {
    setLoading(true);
    fetchJson<Discount[]>('/api/discounts', { cache: 'no-store' })
      .then((data) => setDiscounts(Array.isArray(data) ? data : []))
      .catch(() => setDiscounts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openDiscount = useCallback((discount: Discount, updateUrl = true) => {
    setSelected(discount);
    setMsg('');
    if (updateUrl) router.replace(`/discounts?open=${discount.id}`, { scroll: false });
  }, [router]);

  const closeDiscount = () => {
    setSelected(null);
    router.replace('/discounts', { scroll: false });
  };

  useEffect(() => {
    const discountId = searchParams.get('open');
    if (!discountId || autoOpenedId === discountId || selected?.id === discountId) return;

    const existing = discounts.find((discount) => discount.id === discountId);
    if (existing) {
      openDiscount(existing, false);
      setAutoOpenedId(discountId);
      return;
    }

    fetchJson<Discount>(`/api/discounts/${discountId}`)
      .then((discount) => {
        setDiscounts((current) => current.some((item) => item.id === discount.id) ? current : [discount, ...current]);
        openDiscount(discount, false);
        setAutoOpenedId(discountId);
      })
      .catch((error) => setMsg(error instanceof Error ? error.message : t('failedToOpenCode', { fallback: 'تعذر فتح الكود' })));
  }, [autoOpenedId, discounts, openDiscount, searchParams, selected?.id, t]);

  const mergeDiscount = (id: string, patch: Partial<Discount>) => {
    setDiscounts((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    setSelected((current) => (current?.id === id ? { ...current, ...patch } : current));
  };

  const patchDiscount = async (discount: Discount, patch: Partial<Discount>) => {
    const previous = discount;
    setMsg('');
    mergeDiscount(discount.id, patch);
    try {
      const updated = await fetchJson<Discount>(`/api/discounts/${discount.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      mergeDiscount(discount.id, updated);
      setMsg(tCommon('saved', { fallback: 'تم الحفظ' }));
    } catch (error) {
      mergeDiscount(previous.id, previous);
      setMsg(error instanceof Error ? error.message : tCommon('saveFailed', { fallback: 'فشل الحفظ' }));
    }
  };

  const createDiscount = async () => {
    if (!newForm.code || !newForm.value) return;
    const body: Record<string, unknown> = {
      code: newForm.code.toUpperCase(),
      type: newForm.type,
      value: Number(newForm.value),
      is_active: true,
    };
    if (newForm.min_order_syp) body.min_order_syp = Number(newForm.min_order_syp);
    if (newForm.valid_from) body.valid_from = newForm.valid_from;
    if (newForm.valid_until) body.valid_until = newForm.valid_until;
    if (newForm.max_uses) body.max_uses = Number(newForm.max_uses);
    await fetchJson<Discount>('/api/discounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setNewForm({ code: '', type: 'percentage', value: '', min_order_syp: '', valid_from: '', valid_until: '', max_uses: '' });
    setShowCreate(false);
    load();
  };

  return (
    <div className="space-y-5" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1C1917]">{t('discountsTitle', { fallback: 'الخصومات' })}</h1>
          <p className="mt-1 text-sm text-[#A8A29E]">{t('discountsCount', { count: discounts.length, fallback: `${discounts.length} كود خصم` })}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#57534E] hover:border-[#B8860B]"><RefreshCw size={15} />{tCommon('refresh', { fallback: 'تحديث' })}</button>
          <button type="button" onClick={() => setShowCreate((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2 text-sm font-black text-white hover:bg-[#2D2926]"><Plus size={15} />{t('newDiscount', { fallback: 'كود جديد' })}</button>
        </div>
      </div>

      {showCreate ? (
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={newForm.code} onChange={(e) => setNewForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder={t('code', { fallback: 'الكود' })} className={`${inputClass} font-mono`} dir="ltr" />
            <select value={newForm.type} onChange={(e) => setNewForm((f) => ({ ...f, type: e.target.value }))} className={inputClass} dir={isAr ? "rtl" : "ltr"}>
              <option value="percentage">{t('typePercentage', { fallback: 'نسبة %' })}</option>
              <option value="fixed">{t('typeFixed', { fallback: 'مبلغ ثابت' })}</option>
            </select>
            <input type="number" value={newForm.value} onChange={(e) => setNewForm((f) => ({ ...f, value: e.target.value }))} placeholder={t('value', { fallback: 'القيمة' })} className={inputClass} />
            <input type="number" value={newForm.min_order_syp} onChange={(e) => setNewForm((f) => ({ ...f, min_order_syp: e.target.value }))} placeholder={t('minOrder', { fallback: 'الحد الأدنى' })} className={inputClass} />
            <input type="date" value={newForm.valid_from} onChange={(e) => setNewForm((f) => ({ ...f, valid_from: e.target.value }))} className={inputClass} dir="ltr" />
            <input type="date" value={newForm.valid_until} onChange={(e) => setNewForm((f) => ({ ...f, valid_until: e.target.value }))} className={inputClass} dir="ltr" />
            <input type="number" value={newForm.max_uses} onChange={(e) => setNewForm((f) => ({ ...f, max_uses: e.target.value }))} placeholder={t('maxUses', { fallback: 'أقصى استخدام' })} className={inputClass} />
            <button type="button" onClick={() => void createDiscount()} disabled={!newForm.code || !newForm.value} className="rounded-xl bg-[#B8860B] py-2 text-sm font-bold text-white disabled:opacity-50">{t('createBtn', { fallback: 'إنشاء' })}</button>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? <p className="p-10 text-center text-sm text-[#A8A29E]">{tCommon('loading', { fallback: 'جار التحميل...' })}</p>
        : discounts.length === 0 ? <p className="p-10 text-center text-sm text-[#A8A29E]">{t('noDiscounts', { fallback: 'لا توجد أكواد خصم' })}</p>
        : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]"><tr>{[t('code', { fallback: 'الكود' }), t('type', { fallback: 'النوع' }), t('value', { fallback: 'القيمة' }), t('uses', { fallback: 'الاستخدامات' }), t('status', { fallback: 'الحالة' })].map((h,i)=><th key={h} className={`px-5 py-3 ${isAr ? "text-right" : "text-left"} text-xs font-black text-[#A8A29E] ${i>=3?'hidden md:table-cell':''}`}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {discounts.map((discount) => (
                  <tr key={discount.id} className="group cursor-pointer transition-colors hover:bg-[#FFFBF0]" onClick={() => openDiscount(discount)}>
                    <td className="px-5 py-3 font-mono font-bold text-[#1C1917] group-hover:text-[#B8860B]">{discount.code}</td>
                    <td className="px-5 py-3 text-[#57534E]">{discount.type === 'percentage' ? t('percentage', { fallback: 'نسبة' }) : t('fixed', { fallback: 'ثابت' })}</td>
                    <td className="px-5 py-3 font-bold text-[#B8860B]">{discount.type === 'percentage' ? `${discount.value}%` : money(discount.value, locale === 'ar' ? 'ar-SY' : 'en-US')}</td>
                    <td className="hidden px-5 py-3 text-xs text-[#A8A29E] md:table-cell">{discount.used_count ?? 0}{discount.max_uses ? ` / ${discount.max_uses}` : ''}</td>
                    <td className="hidden px-5 py-3 md:table-cell" onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => void patchDiscount(discount, { is_active: !discount.is_active })} className={`rounded-full border px-3 py-1 text-xs font-bold ${discount.is_active ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{discount.is_active ? t('statusActive', { fallback: 'نشط' }) : t('statusInactive', { fallback: 'معطّل' })}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected ? (
        <Modal title={t('discountCodeHeader', { code: selected.code, fallback: `كود: ${selected.code}` })} onClose={closeDiscount} closeTitle={tCommon('close', { fallback: 'إغلاق' })}>
          <div className="space-y-4">
            {msg ? <div className={`rounded-xl border px-4 py-2 text-sm font-bold ${msg === tCommon('saved', { fallback: 'تم الحفظ' }) ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{msg}</div> : null}
            <div className="rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
              <div className="space-y-2">
                <Field label={t('code', { fallback: 'الكود' })}><InlineText value={selected.code} dir="ltr" onSave={(code) => patchDiscount(selected, { code: code.toUpperCase() })} /></Field>
                <Field label={t('type', { fallback: 'النوع' })}><TypePills value={selected.type} onSave={(type) => patchDiscount(selected, { type })} t={t} /></Field>
                <Field label={t('value', { fallback: 'القيمة' })}><InlineNumber value={selected.value} onSave={(value) => patchDiscount(selected, { value: Number(value ?? 0) })} locale={locale === 'ar' ? 'ar-SY' : 'en-US'} /></Field>
                <Field label={t('minOrder', { fallback: 'الحد الأدنى' })}><InlineNumber value={selected.min_order_syp ?? null} nullable onSave={(value) => patchDiscount(selected, { min_order_syp: value })} locale={locale === 'ar' ? 'ar-SY' : 'en-US'} /></Field>
                <Field label={t('maxUses', { fallback: 'أقصى استخدام' })}><InlineNumber value={selected.max_uses ?? null} nullable onSave={(value) => patchDiscount(selected, { max_uses: value })} locale={locale === 'ar' ? 'ar-SY' : 'en-US'} /></Field>
                <Field label={t('validFrom', { fallback: 'صالح من' })}><input type="date" value={toDateInput(selected.valid_from)} onChange={(e) => void patchDiscount(selected, { valid_from: e.target.value || null })} className={inputClass} dir="ltr" /></Field>
                <Field label={t('validUntil', { fallback: 'صالح حتى' })}><input type="date" value={toDateInput(selected.valid_until)} onChange={(e) => void patchDiscount(selected, { valid_until: e.target.value || null })} className={inputClass} dir="ltr" /></Field>
                <Field label={t('status', { fallback: 'الحالة' })}><ActivePills value={selected.is_active} onSave={(is_active) => patchDiscount(selected, { is_active })} t={t} /></Field>
                <Field label={t('uses', { fallback: 'الاستخدامات' })}><div className="min-h-9 rounded-xl px-3 py-2 text-sm font-semibold text-[#1C1917]">{selected.used_count ?? 0}{selected.max_uses ? ` / ${selected.max_uses}` : ''}</div></Field>
                <Field label={t('dateRange', { fallback: 'النطاق' })}><div className="min-h-9 rounded-xl px-3 py-2 text-sm font-semibold text-[#1C1917]" dir="ltr">{formatDate(selected.valid_from, locale === 'ar' ? 'ar-SY' : 'en-US')} - {formatDate(selected.valid_until, locale === 'ar' ? 'ar-SY' : 'en-US')}</div></Field>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
