'use client';

import { RefreshCw, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type Rate = {
  id: string;
  governorate: string;
  base_rate_syp: number;
  free_shipping_threshold_syp?: number | null;
  estimated_days?: number | null;
  is_active: boolean;
};

const inputClass =
  'w-full rounded-xl border border-[#E5E0D8] bg-white px-3 py-2 text-sm text-[#1C1917] outline-none transition focus:border-[#B8860B]';

function money(value?: number | null) {
  return value == null ? '—' : `${Number(value).toLocaleString('ar-SY')} ل.س`;
}

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
      <div className="w-full max-w-xl rounded-2xl border border-[#E5E0D8] bg-[#FFFCF7] shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] bg-white px-5 py-4">
          <h2 className="font-black text-[#1C1917]">{title}</h2>
          <button type="button" title="إغلاق" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F8F6F2] text-[#57534E] hover:bg-[#E5E0D8]">
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

function InlineText({ value, onSave, dir = 'rtl' }: { value?: string | null; onSave: (value: string) => Promise<void> | void; dir?: 'rtl' | 'ltr' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  useEffect(() => { if (!editing) setDraft(value ?? ''); }, [editing, value]);
  const commit = () => { const next = draft.trim(); setEditing(false); if (next !== (value ?? '')) void onSave(next); };
  if (editing) return <input autoFocus value={draft} dir={dir} onBlur={commit} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }} className={inputClass} />;
  return <button type="button" onClick={() => setEditing(true)} dir={dir} className="min-h-9 w-full rounded-xl px-3 py-2 text-start text-sm font-semibold text-[#1C1917] transition hover:bg-[#FAF7EF]">{value || <span className="text-[#A8A29E]">—</span>}</button>;
}

function InlineNumber({
  value,
  nullable = false,
  onSave,
}: {
  value?: number | null;
  nullable?: boolean;
  onSave: (value: number | null) => Promise<void> | void;
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
    <button type="button" onClick={() => setEditing(true)} className="min-h-9 w-full rounded-xl px-3 py-2 text-start text-sm font-bold text-[#1C1917] transition hover:bg-[#FAF7EF]">
      {money(value)}
    </button>
  );
}

function ActivePills({ value, onSave }: { value: boolean; onSave: (value: boolean) => Promise<void> | void }) {
  return (
    <div className="flex gap-2">
      {[{ v: true, l: 'نشط', c: 'border-green-200 bg-green-50 text-green-700' }, { v: false, l: 'معطّل', c: 'border-red-200 bg-red-50 text-red-700' }].map((option) => (
        <button key={option.l} type="button" onClick={() => option.v !== value && void onSave(option.v)} className={`rounded-full border px-3 py-1 text-xs font-black ${option.v === value ? option.c : 'border-[#E5E0D8] bg-[#FAF7EF] text-[#8B8172] hover:border-[#B8860B]'}`}>
          {option.l}
        </button>
      ))}
    </div>
  );
}

export default function ShippingRatesQuickAdmin() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      .catch((error) => setMsg(error instanceof Error ? error.message : 'تعذر فتح سعر الشحن'));
  }, [autoOpenedId, openRate, rates, searchParams, selected?.id]);

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
      setMsg('تم الحفظ');
    } catch (error) {
      mergeRate(previous.id, previous);
      setMsg(error instanceof Error ? error.message : 'فشل الحفظ');
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-[#1C1917]">أسعار الشحن</h1>
          <p className="mt-1 text-sm text-[#A8A29E]">{rates.length} محافظة</p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#57534E] hover:border-[#B8860B]"><RefreshCw size={15} />تحديث</button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? <p className="p-10 text-center text-sm text-[#A8A29E]">جار التحميل...</p>
        : rates.length === 0 ? <p className="p-10 text-center text-sm text-[#A8A29E]">لا توجد أسعار شحن</p>
        : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]"><tr>{['المحافظة','سعر الشحن','مجاني فوق','الحالة'].map((h,i)=><th key={h} className={`px-5 py-3 text-right text-xs font-black text-[#A8A29E] ${i>=2?'hidden md:table-cell':''}`}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {rates.map((rate) => (
                  <tr key={rate.id} className="group cursor-pointer transition-colors hover:bg-[#FFFBF0]" onClick={() => openRate(rate)}>
                    <td className="px-5 py-3 font-semibold text-[#1C1917] group-hover:text-[#B8860B]">{rate.governorate}</td>
                    <td className="px-5 py-3 font-bold text-[#B8860B]">{money(rate.base_rate_syp)}</td>
                    <td className="hidden px-5 py-3 text-xs text-[#A8A29E] md:table-cell">{money(rate.free_shipping_threshold_syp)}</td>
                    <td className="hidden px-5 py-3 md:table-cell" onClick={(event) => event.stopPropagation()}>
                      <button type="button" onClick={() => void patchRate(rate, { is_active: !rate.is_active })} className={`rounded-full border px-3 py-1 text-xs font-bold ${rate.is_active ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{rate.is_active ? 'نشط' : 'معطّل'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected ? (
        <Modal title={selected.governorate} onClose={closeRate}>
          <div className="space-y-4">
            {msg ? <div className={`rounded-xl border px-4 py-2 text-sm font-bold ${msg === 'تم الحفظ' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{msg}</div> : null}
            <div className="rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
              <div className="space-y-2">
                <Field label="المحافظة"><InlineText value={selected.governorate} onSave={(governorate) => patchRate(selected, { governorate })} /></Field>
                <Field label="سعر الشحن"><InlineNumber value={selected.base_rate_syp} onSave={(base_rate_syp) => patchRate(selected, { base_rate_syp: Number(base_rate_syp ?? 0) })} /></Field>
                <Field label="شحن مجاني فوق"><InlineNumber value={selected.free_shipping_threshold_syp ?? null} nullable onSave={(free_shipping_threshold_syp) => patchRate(selected, { free_shipping_threshold_syp })} /></Field>
                <Field label="الحالة"><ActivePills value={selected.is_active} onSave={(is_active) => patchRate(selected, { is_active })} /></Field>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
