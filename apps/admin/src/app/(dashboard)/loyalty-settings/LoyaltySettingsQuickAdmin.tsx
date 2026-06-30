'use client';

import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';

type LoyaltyKey =
  | 'loyalty_earn_amount_syp'
  | 'loyalty_earn_points'
  | 'loyalty_redeem_points_per_syp'
  | 'loyalty_max_redeem_percent'
  | 'loyalty_referral_bonus_points';

type SettingRow = {
  key: string;
  value: string | null;
  updated_at?: string | null;
};

type FieldConfig = {
  key: LoyaltyKey;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  fallback: string;
};

const FIELDS: FieldConfig[] = [
  { key: 'loyalty_earn_amount_syp', label: 'مبلغ كسب النقاط', unit: 'ل.س', min: 1, max: 999999999, step: 500, fallback: '1000' },
  { key: 'loyalty_earn_points', label: 'نقاط الكسب', unit: 'نقطة', min: 0, max: 1000000, step: 1, fallback: '10' },
  { key: 'loyalty_redeem_points_per_syp', label: 'نقاط كل ليرة خصم', unit: 'نقطة', min: 1, max: 1000000, step: 1, fallback: '1' },
  { key: 'loyalty_max_redeem_percent', label: 'أقصى خصم بالنقاط', unit: '%', min: 0, max: 100, step: 1, fallback: '20' },
  { key: 'loyalty_referral_bonus_points', label: 'مكافأة الإحالة', unit: 'نقطة', min: 0, max: 1000000, step: 1, fallback: '50' },
];

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

function toNumber(value: string | undefined) {
  const parsed = Number(value ?? '0');
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('ar-SY', { maximumFractionDigits: 0 }).format(value);
}

function formatSyp(value: number) {
  return `${formatNumber(value)} ل.س`;
}

function normalizeInteger(value: string, field: FieldConfig) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return null;
  const bounded = Math.min(field.max, Math.max(field.min, Math.floor(numberValue)));
  return String(bounded);
}

function InlineNumber({
  field,
  value,
  onSave,
}: {
  field: FieldConfig;
  value: string;
  onSave: (value: string) => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [editing, value]);

  const commit = () => {
    const normalized = normalizeInteger(draft, field);
    setEditing(false);
    if (normalized !== null && normalized !== value) void onSave(normalized);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          value={draft}
          onBlur={commit}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Enter') commit();
            if (event.key === 'Escape') setEditing(false);
          }}
          className={inputClass}
        />
        <span className="w-16 shrink-0 text-xs font-black text-[#8B8172]">{field.unit}</span>
      </div>
    );
  }

  return (
    <button type="button" onClick={() => setEditing(true)} className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 py-2 text-start transition hover:bg-[#FAF7EF]">
      <span className="font-mono text-lg font-black text-[#1C1917]" dir="ltr">{formatNumber(toNumber(value))}</span>
      <span className="text-xs font-black text-[#8B8172]">{field.unit}</span>
    </button>
  );
}

export default function LoyaltySettingsQuickAdmin() {
  const [rows, setRows] = useState<SettingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    fetchJson<SettingRow[]>('/api/settings', { cache: 'no-store' })
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const values = useMemo(() => {
    const map = new Map(rows.map((row) => [row.key, row.value ?? '']));
    return Object.fromEntries(FIELDS.map((field) => [field.key, map.get(field.key) || field.fallback])) as Record<LoyaltyKey, string>;
  }, [rows]);

  const numbers = useMemo(() => {
    const earnAmount = Math.max(1, toNumber(values.loyalty_earn_amount_syp));
    const earnPoints = Math.max(0, toNumber(values.loyalty_earn_points));
    const redeemPointsPerSyp = Math.max(1, toNumber(values.loyalty_redeem_points_per_syp));
    const maxRedeemPercent = Math.min(100, Math.max(0, toNumber(values.loyalty_max_redeem_percent)));
    const referralBonus = Math.max(0, toNumber(values.loyalty_referral_bonus_points));
    const exampleOrder = 50000;
    const exampleEarned = Math.floor(exampleOrder / earnAmount) * earnPoints;
    const exampleDiscount = Math.floor(exampleEarned / redeemPointsPerSyp);
    const exampleLimit = Math.floor(exampleOrder * (maxRedeemPercent / 100));

    return {
      earnAmount,
      earnPoints,
      redeemPointsPerSyp,
      maxRedeemPercent,
      referralBonus,
      exampleOrder,
      exampleEarned,
      appliedDiscount: Math.min(exampleDiscount, exampleLimit),
    };
  }, [values]);

  const patchField = async (field: FieldConfig, value: string) => {
    const previous = rows;
    setMsg('');
    setRows((current) => {
      const exists = current.some((row) => row.key === field.key);
      const next = { key: field.key, value, updated_at: new Date().toISOString() };
      return exists ? current.map((row) => (row.key === field.key ? { ...row, ...next } : row)) : [...current, next];
    });
    try {
      await fetchJson<{ updated: number }>('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: field.key, value, description: field.label }),
      });
      setMsg('تم الحفظ');
    } catch (error) {
      setRows(previous);
      setMsg(error instanceof Error ? error.message : 'فشل الحفظ');
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1C1917]">الولاء</h1>
          <p className="mt-1 text-sm text-[#A8A29E]">القيم المهمة فقط، وكل قيمة تتعدل من مكانها</p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#57534E] hover:border-[#B8860B]">
          <RefreshCw size={15} />تحديث
        </button>
      </div>

      {msg ? <div className={`rounded-xl border px-4 py-2 text-sm font-bold ${msg === 'تم الحفظ' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{msg}</div> : null}

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
          <p className="text-xs font-black text-[#8B8172]">الكسب</p>
          <p className="mt-2 text-sm font-black text-[#1C1917]">كل {formatSyp(numbers.earnAmount)} = {formatNumber(numbers.earnPoints)} نقطة</p>
        </div>
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
          <p className="text-xs font-black text-[#8B8172]">الاستبدال</p>
          <p className="mt-2 text-sm font-black text-[#1C1917]">{formatNumber(numbers.redeemPointsPerSyp)} نقطة = 1 ل.س</p>
        </div>
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
          <p className="text-xs font-black text-[#8B8172]">طلب 50,000</p>
          <p className="mt-2 text-sm font-black text-[#1C1917]">{formatNumber(numbers.exampleEarned)} نقطة / {formatSyp(numbers.appliedDiscount)}</p>
        </div>
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
          <p className="text-xs font-black text-[#8B8172]">الإحالة</p>
          <p className="mt-2 text-sm font-black text-[#1C1917]">{formatNumber(numbers.referralBonus)} نقطة</p>
        </div>
      </section>

      {loading ? <p className="rounded-2xl border border-[#E5E0D8] bg-white p-10 text-center text-sm text-[#A8A29E]">جار التحميل...</p>
      : (
        <section className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
          <div className="grid gap-3 xl:grid-cols-2">
            {FIELDS.map((field) => (
              <div key={field.key} className="rounded-xl border border-[#F0ECE6] bg-[#FFFCF7] p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-[#1C1917]">{field.label}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-[#A8A29E]" dir="ltr">{field.key}</p>
                  </div>
                  <span className="rounded-full border border-[#E5E0D8] bg-white px-2 py-1 text-[11px] font-black text-[#8B8172]">{field.unit}</span>
                </div>
                <InlineNumber field={field} value={values[field.key]} onSave={(value) => patchField(field, value)} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
