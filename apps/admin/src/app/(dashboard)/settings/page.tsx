'use client';

import { useEffect, useMemo, useState } from 'react';

interface Setting {
  key: string;
  value: string;
  description?: string | null;
}

const DEFAULT_SETTINGS: Setting[] = [
  {
    key: 'usd_exchange_rate',
    value: '15000',
    description: 'سعر صرف الدولار مقابل الليرة السورية.'
  },
  {
    key: 'max_exchange_days',
    value: '7',
    description: 'أقصى عدد أيام مسموح لطلب الاستبدال بعد التسليم.'
  },
  {
    key: 'loyalty_earn_amount_syp',
    value: '10000',
    description: 'المبلغ المطلوب لكسب نقاط الولاء.'
  },
  {
    key: 'loyalty_earn_points',
    value: '1',
    description: 'عدد النقاط المكتسبة عند تحقق مبلغ الكسب.'
  },
  {
    key: 'loyalty_max_redeem_percent',
    value: '20',
    description: 'أقصى نسبة من الطلب يمكن دفعها بالنقاط.'
  },
  {
    key: 'referral_bonus_points',
    value: '50',
    description: 'نقاط مكافأة الإحالة.'
  }
];

const LABELS: Record<string, string> = {
  usd_exchange_rate: 'سعر صرف الدولار',
  max_exchange_days: 'مدة الاستبدال القصوى',
  loyalty_earn_amount_syp: 'مبلغ كسب نقاط الولاء',
  loyalty_earn_points: 'نقاط الكسب',
  loyalty_max_redeem_percent: 'أقصى نسبة استبدال',
  referral_bonus_points: 'نقاط الإحالة',
  loyalty_redeem_points_per_syp: 'نقاط الاستبدال لكل ليرة',
  loyalty_referral_bonus_points: 'مكافأة الإحالة'
};

function pickArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];

  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    for (const key of ['data', 'items', 'settings', 'rows']) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
  }

  return [];
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>(DEFAULT_SETTINGS);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(DEFAULT_SETTINGS.map((s) => [s.key, s.value]))
  );
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [error, setError] = useState('');

  const defaultKeys = useMemo(() => new Set(DEFAULT_SETTINGS.map((s) => s.key)), []);

  async function load() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        setError((payload as { error?: string } | null)?.error ?? 'تعذر تحميل الإعدادات');
        setSettings(DEFAULT_SETTINGS);
        setValues(Object.fromEntries(DEFAULT_SETTINGS.map((s) => [s.key, s.value])));
        return;
      }

      const rows = pickArray<Setting>(payload);
      const byKey = new Map(rows.map((row) => [row.key, row]));
      const mergedDefaults = DEFAULT_SETTINGS.map((setting) => ({
        ...setting,
        value: byKey.get(setting.key)?.value ?? setting.value,
        description: byKey.get(setting.key)?.description ?? setting.description
      }));
      const extras = rows.filter((row) => !defaultKeys.has(row.key));
      const merged = [...mergedDefaults, ...extras];

      setSettings(merged);
      setValues(Object.fromEntries(merged.map((s) => [s.key, s.value ?? ''])));
    } catch {
      setError('تعذر الاتصال بالخادم');
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(key: string) {
    setSavingKey(key);
    setSavedKey(null);
    setError('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: values[key] ?? '' })
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        setError((payload as { error?: string } | null)?.error ?? 'فشل حفظ الإعداد');
      } else {
        setSavedKey(key);
        window.setTimeout(() => setSavedKey(null), 1800);
      }
    } catch {
      setError('تعذر حفظ الإعداد');
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-3xl border border-white/10 bg-[#101010] p-6 shadow-2xl">
        <h1 className="text-3xl font-black text-white">الإعدادات</h1>
        <p className="mt-2 text-sm leading-7 text-[#9CA3AF]">
          إعدادات النظام العامة، سعر الصرف، الاستبدال، والولاء.
        </p>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <section className="rounded-3xl border border-white/10 bg-[#101010] p-6 shadow-2xl">
        {loading ? (
          <div className="p-10 text-center text-[#9CA3AF]">جار التحميل...</div>
        ) : (
          <div className="space-y-4">
            {settings.map((setting) => (
              <div
                key={setting.key}
                className="grid gap-4 rounded-3xl border border-white/10 bg-black/20 p-4 xl:grid-cols-[1fr_360px_110px]"
              >
                <div>
                  <div className="font-black text-white">{LABELS[setting.key] ?? setting.key}</div>
                  <div className="mt-1 text-xs font-mono text-[#7E766B]">{setting.key}</div>
                  {setting.description ? (
                    <div className="mt-2 text-sm leading-6 text-[#9CA3AF]">{setting.description}</div>
                  ) : null}
                </div>

                <input
                  value={values[setting.key] ?? ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [setting.key]: e.target.value }))}
                  className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 font-mono text-white outline-none focus:border-[#C9A84C]"
                />

                <button
                  type="button"
                  disabled={savingKey === setting.key}
                  onClick={() => save(setting.key)}
                  className="rounded-2xl bg-[#C9A84C] px-4 py-3 text-sm font-black text-[#111111] hover:bg-[#D8B95F] disabled:opacity-50"
                >
                  {savedKey === setting.key ? 'تم' : savingKey === setting.key ? '...' : 'حفظ'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}