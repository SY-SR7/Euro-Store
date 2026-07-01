'use client';

import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';

type Setting = {
  key: string;
  value: string;
  description?: string | null;
  updated_at?: string | null;
};

type SettingConfig = {
  key: string;
  labelKey: string;
  groupKey: string;
  fallback: string;
  unitKey: string;
  type: 'number' | 'text';
};

const SETTINGS: SettingConfig[] = [
  // --- System ---
  { key: 'usd_exchange_rate',            labelKey: 'usd_exchange_rate',            groupKey: 'groupSystem',   fallback: '15000', unitKey: 'unitSyp',     type: 'number' },
  { key: 'max_exchange_days',            labelKey: 'max_exchange_days',            groupKey: 'groupSystem',   fallback: '7',     unitKey: 'unitDays',    type: 'number' },
  { key: 'min_order_value_syp',          labelKey: 'min_order_value_syp',          groupKey: 'groupSystem',   fallback: '0',     unitKey: 'unitSyp',     type: 'number' },
  // --- Contact ---
  { key: 'contact_whatsapp',             labelKey: 'contact_whatsapp',             groupKey: 'groupContact',  fallback: '',      unitKey: 'unitNone',    type: 'text'   },
  { key: 'contact_email',                labelKey: 'contact_email',                groupKey: 'groupContact',  fallback: '',      unitKey: 'unitNone',    type: 'text'   },
  // --- Loyalty ---
  { key: 'loyalty_earn_amount_syp',      labelKey: 'loyalty_earn_amount_syp',      groupKey: 'groupLoyalty',  fallback: '1000',  unitKey: 'unitSyp',     type: 'number' },
  { key: 'loyalty_earn_points',          labelKey: 'loyalty_earn_points',          groupKey: 'groupLoyalty',  fallback: '10',    unitKey: 'unitPoints',  type: 'number' },
  { key: 'loyalty_point_value_syp',      labelKey: 'loyalty_point_value_syp',      groupKey: 'groupLoyalty',  fallback: '10',    unitKey: 'unitSyp',     type: 'number' },
  { key: 'loyalty_max_redemption_pct',   labelKey: 'loyalty_max_redemption_pct',   groupKey: 'groupLoyalty',  fallback: '30',    unitKey: 'unitPercent', type: 'number' },
  { key: 'loyalty_min_redemption_pts',   labelKey: 'loyalty_min_redemption_pts',   groupKey: 'groupLoyalty',  fallback: '100',   unitKey: 'unitPoints',  type: 'number' },
  { key: 'referral_bonus_points',        labelKey: 'referral_bonus_points',        groupKey: 'groupLoyalty',  fallback: '50',    unitKey: 'unitPoints',  type: 'number' },
];

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

function formatDate(value?: string | null, locale = 'ar-SY') {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function InlineSetting({
  config,
  value,
  onSave,
  unitLabel,
}: {
  config: SettingConfig;
  value: string;
  onSave: (value: string) => void | Promise<void>;
  unitLabel: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [editing, value]);

  const commit = () => {
    const next = draft.trim();
    setEditing(false);
    if (next !== value) void onSave(next);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          type={config.type}
          value={draft}
          dir="ltr"
          onBlur={commit}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Enter') commit();
            if (event.key === 'Escape') setEditing(false);
          }}
          className={inputClass}
        />
        <span className="w-14 shrink-0 text-xs font-black text-[#8B8172]">{unitLabel}</span>
      </div>
    );
  }

  return (
    <button type="button" onClick={() => setEditing(true)} className="flex min-h-10 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-start transition hover:bg-background">
      <span className="font-mono text-sm font-black text-text-primary" dir="ltr">{value || '-'}</span>
      <span className="shrink-0 text-xs font-black text-[#8B8172]">{unitLabel}</span>
    </button>
  );
}

export default function SettingsQuickAdmin() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const locale = useLocale();
  const isAr = locale === 'ar';
  const t = useTranslations('adminSettings');
  const tCommon = useTranslations('common');

  const load = useCallback(() => {
    setLoading(true);
    fetchJson<Setting[]>('/api/settings', { cache: 'no-store' })
      .then((data) => setSettings(Array.isArray(data) ? data : []))
      .catch(() => setSettings([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const values = useMemo(() => {
    const map = new Map(settings.map((setting) => [setting.key, setting]));
    return SETTINGS.map((config) => ({ config, row: map.get(config.key), value: map.get(config.key)?.value ?? config.fallback }));
  }, [settings]);

  const patchSetting = async (config: SettingConfig, value: string) => {
    const previous = settings;
    setMsg('');
    const label = t(config.labelKey);
    setSettings((current) => {
      const exists = current.some((item) => item.key === config.key);
      const updated: Setting = { key: config.key, value, description: label, updated_at: new Date().toISOString() };
      return exists ? current.map((item) => (item.key === config.key ? { ...item, ...updated } : item)) : [...current, updated];
    });
    try {
      await fetchJson<{ updated: number }>('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: config.key, value, description: label }),
      });
      setMsg(tCommon('saved', { fallback: 'تم الحفظ' }));
    } catch (error) {
      setSettings(previous);
      setMsg(error instanceof Error ? error.message : tCommon('saveFailed', { fallback: 'فشل الحفظ' }));
    }
  };

  const groups = [...new Set(SETTINGS.map((item) => item.groupKey))];

  return (
    <div className="space-y-5" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E0D8] bg-background-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-primary">{t('settingsTitle', { fallback: 'إعدادات النظام' })}</h1>
          <p className="mt-1 text-sm text-text-muted">{t('settingsDesc', { fallback: 'القيم العامة' })}</p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-text-secondary hover:border-primary">
          <RefreshCw size={15} />{tCommon('refresh', { fallback: 'تحديث' })}
        </button>
      </div>

      {msg ? <div className={`rounded-xl border px-4 py-2 text-sm font-bold ${msg === tCommon('saved', { fallback: 'تم الحفظ' }) ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{msg}</div> : null}

      {loading ? <p className="rounded-2xl border border-[#E5E0D8] bg-background-card p-4 md:p-10 text-center text-sm text-text-muted">{tCommon('loading', { fallback: 'جار التحميل...' })}</p>
      : (
        <div className="grid gap-5 xl:grid-cols-2">
          {groups.map((groupKey) => (
            <section key={groupKey} className="rounded-2xl border border-[#E5E0D8] bg-background-card p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-black text-primary">{t(groupKey)}</h2>
              <div className="divide-y divide-[#F0ECE6]">
                {values.filter((item) => item.config.groupKey === groupKey).map(({ config, row, value }) => (
                  <div key={config.key} className="grid gap-2 py-3 first:pt-0 last:pb-0 md:grid-cols-[190px_minmax(0,1fr)] md:items-center">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-text-primary">{t(config.labelKey)}</p>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-text-muted" dir="ltr">{config.key}</p>
                      {row?.updated_at ? <p className="mt-1 text-[11px] text-text-muted">{formatDate(row.updated_at, locale === 'ar' ? 'ar-SY' : 'en-US')}</p> : null}
                    </div>
                    <InlineSetting config={config} value={value} unitLabel={t(config.unitKey)} onSave={(next) => patchSetting(config, next)} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
