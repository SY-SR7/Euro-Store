'use client';

import { RefreshCw, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';

type Rate = {
  id: string;
  governorate: string;
  base_rate_syp: number;
  free_shipping_threshold_syp?: number | null;
  estimated_days?: number | null;
  is_active: boolean;
};

const inputClass =
  'w-full rounded-xl border border-[#E5E0D8] bg-background-card px-3 py-2 text-sm text-text-primary outline-none transition focus:border-primary';

function money(value: number | null | undefined, locale: string, currencySymbol: string) {
  return value == null ? '—' : `${Number(value).toLocaleString(locale)} ${currencySymbol}`;
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
      <div className="w-full max-w-xl rounded-2xl border border-[#E5E0D8] bg-[#FFFCF7] shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] bg-background-card px-5 py-4">
          <h2 className="font-black text-text-primary">{title}</h2>
          <button type="button" title={closeTitle || "Close"} onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F8F6F2] text-text-secondary hover:bg-[#E5E0D8]">
            <X size={17} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-[#F0ECE6] pb-2 last:border-0 last:pb-0 sm:grid-cols-[150px_minmax(0,1fr)]">
      <span className="text-xs font-bold text-[#8B8172]">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function InlineText({ value, onSave, dir = 'rtl', emptyField = '—' }: { value?: string | null; onSave: (value: string) => Promise<void> | void; dir?: 'rtl' | 'ltr'; emptyField?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  useEffect(() => { if (!editing) setDraft(value ?? ''); }, [editing, value]);
  const commit = () => { const next = draft.trim(); setEditing(false); if (next !== (value ?? '')) void onSave(next); };
  if (editing) return <input autoFocus value={draft} dir={dir} onBlur={commit} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }} className={inputClass} />;
  return <button type="button" onClick={() => setEditing(true)} dir={dir} className="min-h-9 w-full rounded-xl px-3 py-2 text-start text-sm font-semibold text-text-primary transition hover:bg-background">{value || <span className="text-text-muted">{emptyField}</span>}</button>;
}

function InlineNumber({
  value,
  nullable = false,
  onSave,
  locale = 'ar-SY',
  currencySymbol = 'ل.س'
}: {
  value?: number | null;
  nullable?: boolean;
  onSave: (value: number | null) => Promise<void> | void;
  locale?: string;
  currencySymbol?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value == null ? '' : String(value));

  useEffect(() => {
    if (!editing) setDraft(value == null ? '' : String(value));
  }, [editing, value]);

  const commit = () => {
    const trimmed = draft.trim();
    setEditing(false);
    if (!trimmed && nullable) {
      if (value !== null) void onSave(null);
      return;
    }
    const next = Number(trimmed);
    if (Number.isFinite(next) && next !== (value ?? null)) void onSave(next);
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
    <button type="button" onClick={() => setEditing(true)} className="min-h-9 w-full rounded-xl px-3 py-2 text-start text-sm font-bold text-text-primary transition hover:bg-background" dir="ltr">
      {money(value, locale, currencySymbol)}
    </button>
  );
}

function ActivePills({ value, onSave, labelActive, labelDisabled }: { value: boolean; onSave: (value: boolean) => Promise<void> | void; labelActive: string; labelDisabled: string }) {
  return (
    <div className="flex gap-2">
      {[{ v: true, l: labelActive, c: 'border-green-200 bg-green-50 text-green-700' }, { v: false, l: labelDisabled, c: 'border-red-200 bg-red-50 text-red-700' }].map((option) => (
        <button key={option.l} type="button" onClick={() => option.v !== value && void onSave(option.v)} className={`rounded-full border px-3 py-1 text-xs font-black ${option.v === value ? option.c : 'border-[#E5E0D8] bg-background text-[#8B8172] hover:border-primary'}`}>
          {option.l}
        </button>
      ))}
    </div>
  );
}

export default function ShippingRatesQuickAdmin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const isAr = locale === 'ar';
  const t = useTranslations('adminShippingRates');
  const tCommon = useTranslations('common');

  const formatLoc = isAr ? 'ar-SY' : 'en-US';
  const currencySymbol = t('unitSyp');

  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Rate | null>(null);
  const [msg, setMsg] = useState('');
  const [autoOpenedId, setAutoOpenedId] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    fetchJson<Rate[]>('/api/shipping-rates', { cache: 'no-store' })
      .then((data) => setRates(Array.isArray(data) ? data : []))
      .catch(() => setRates([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openRate = useCallback((rate: Rate, updateUrl = true) => {
    setSelected(rate);
    setMsg('');
    if (updateUrl) router.replace(`/shipping-rates?open=${rate.id}`, { scroll: false });
  }, [router]);

  const closeRate = () => {
    setSelected(null);
    router.replace('/shipping-rates', { scroll: false });
  };

  useEffect(() => {
    const rateId = searchParams.get('open');
    if (!rateId || autoOpenedId === rateId || selected?.id === rateId) return;

    const existing = rates.find((rate) => rate.id === rateId);
    if (existing) {
      openRate(existing, false);
      setAutoOpenedId(rateId);
      return;
    }

    fetchJson<Rate>(`/api/shipping-rates/${rateId}`)
      .then((rate) => {
        setRates((current) => current.some((item) => item.id === rate.id) ? current : [rate, ...current]);
        openRate(rate, false);
        setAutoOpenedId(rateId);
      })
      .catch((error) => setMsg(error instanceof Error ? error.message : t('failedToLoadRate')));
  }, [autoOpenedId, openRate, rates, searchParams, selected?.id, t]);

  const mergeRate = (id: string, patch: Partial<Rate>) => {
    setRates((current) => current.map((rate) => (rate.id === id ? { ...rate, ...patch } : rate)));
    setSelected((current) => (current?.id === id ? { ...current, ...patch } : current));
  };

  const patchRate = async (rate: Rate, patch: Partial<Rate>) => {
    const previous = rate;
    setMsg('');
    mergeRate(rate.id, patch);
    try {
      const updated = await fetchJson<Rate>(`/api/shipping-rates/${rate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      mergeRate(rate.id, updated);
      setMsg(tCommon('saved'));
    } catch (error) {
      mergeRate(previous.id, previous);
      setMsg(error instanceof Error ? error.message : tCommon('saveFailed'));
    }
  };

  return (
    <div className="space-y-5" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between rounded-2xl border border-[#E5E0D8] bg-background-card p-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-text-primary">{t('shippingRatesTitle')}</h1>
          <p className="mt-1 text-sm text-text-muted">{t('countGovernorates', { count: rates.length })}</p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-text-secondary hover:border-primary"><RefreshCw size={15} />{tCommon('refresh')}</button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-background-card shadow-sm">
        {loading ? <p className="p-4 md:p-10 text-center text-sm text-text-muted">{tCommon('loading')}</p>
        : rates.length === 0 ? <p className="p-4 md:p-10 text-center text-sm text-text-muted">{t('noShippingRates')}</p>
        : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]"><tr>{[t('tableGovernorate'), t('tableShippingRate'), t('tableFreeShippingOver'), t('tableStatus')].map((h,i)=><th key={h} className={`px-5 py-3 ${isAr ? "text-right" : "text-left"} text-xs font-black text-text-muted ${i>=2?'hidden md:table-cell':''}`}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {rates.map((rate) => (
                  <tr key={rate.id} className="group cursor-pointer transition-colors hover:bg-[#FFFBF0]" onClick={() => openRate(rate)}>
                    <td className="px-5 py-3 font-semibold text-text-primary group-hover:text-primary">{rate.governorate}</td>
                    <td className="px-5 py-3 font-bold text-primary" dir="ltr">{money(rate.base_rate_syp, formatLoc, currencySymbol)}</td>
                    <td className="hidden px-5 py-3 text-xs text-text-muted md:table-cell" dir="ltr">{money(rate.free_shipping_threshold_syp, formatLoc, currencySymbol)}</td>
                    <td className="hidden px-5 py-3 md:table-cell" onClick={(event) => event.stopPropagation()}>
                      <button type="button" onClick={() => void patchRate(rate, { is_active: !rate.is_active })} className={`rounded-full border px-3 py-1 text-xs font-bold ${rate.is_active ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{rate.is_active ? t('statusActive') : t('statusDisabled')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected ? (
        <Modal title={selected.governorate} onClose={closeRate} closeTitle={tCommon('close')}>
          <div className="space-y-4">
            {msg ? <div className={`rounded-xl border px-4 py-2 text-sm font-bold ${msg === tCommon('saved') ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{msg}</div> : null}
            <div className="rounded-2xl border border-[#E5E0D8] bg-background-card p-4 shadow-sm">
              <div className="space-y-2">
                <Field label={t('tableGovernorate')}><InlineText value={selected.governorate} dir={isAr ? "rtl" : "ltr"} emptyField={t('emptyField')} onSave={(governorate) => patchRate(selected, { governorate })} /></Field>
                <Field label={t('tableShippingRate')}><InlineNumber value={selected.base_rate_syp} locale={formatLoc} currencySymbol={currencySymbol} onSave={(base_rate_syp) => patchRate(selected, { base_rate_syp: Number(base_rate_syp ?? 0) })} /></Field>
                <Field label={t('freeShippingAbove')}><InlineNumber value={selected.free_shipping_threshold_syp ?? null} nullable locale={formatLoc} currencySymbol={currencySymbol} onSave={(free_shipping_threshold_syp) => patchRate(selected, { free_shipping_threshold_syp })} /></Field>
                <Field label={t('tableStatus')}><ActivePills value={selected.is_active} labelActive={t('statusActive')} labelDisabled={t('statusDisabled')} onSave={(is_active) => patchRate(selected, { is_active })} /></Field>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
