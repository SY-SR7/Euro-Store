'use client';

import { useEffect, useState } from 'react';

interface LoyaltySetting {
  key: string;
  value: string;
  description?: string | null;
}

const DEFAULT_SETTINGS: LoyaltySetting[] = [
  {
    key: 'loyalty_earn_amount_syp',
    value: '10000',
    description: 'المبلغ بالليرة السورية المطلوب لكسب نقاط.'
  },
  {
    key: 'loyalty_earn_points',
    value: '1',
    description: 'عدد النقاط المكتسبة عند تحقق مبلغ الكسب.'
  },
  {
    key: 'loyalty_redeem_points_per_syp',
    value: '1',
    description: 'كم نقطة مطلوبة مقابل كل ليرة عند الاستبدال.'
  },
  {
    key: 'loyalty_max_redeem_percent',
    value: '20',
    description: 'أقصى نسبة خصم من الطلب يمكن دفعها بالنقاط.'
  },
  {
    key: 'loyalty_referral_bonus_points',
    value: '50',
    description: 'نقاط مكافأة الإحالة.'
  }
];

const LABELS: Record<string, string> = {
  loyalty_earn_amount_syp: 'مبلغ الكسب',
  loyalty_earn_points: 'نقاط الكسب',
  loyalty_redeem_points_per_syp: 'نقاط الاستبدال لكل ليرة',
  loyalty_max_redeem_percent: 'أقصى نسبة استبدال',
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

export default function AdminLoyaltySettingsPage() {
  const [settings, setSettings] = useState<LoyaltySetting[]>(DEFAULT_SETTINGS);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(DEFAULT_SETTINGS.map((s) => [s.key, s.value]))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadSettings() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        setError((payload as { error?: string } | null)?.error ?? 'تعذر تحميل إعدادات الولاء');
        setSettings(DEFAULT_SETTINGS);
        setValues(Object.fromEntries(DEFAULT_SETTINGS.map((s) => [s.key, s.value])));
        return;
      }

      const rows = pickArray<LoyaltySetting>(payload);
      const byKey = new Map(rows.map((row) => [row.key, row]));
      const merged = DEFAULT_SETTINGS.map((item) => ({
        ...item,
        value: byKey.get(item.key)?.value ?? item.value,
        description: byKey.get(item.key)?.description ?? item.description
      }));

      setSettings(merged);
      setValues(Object.fromEntries(merged.map((s) => [s.key, s.value])));
    } catch {
      setError('تعذر الاتصال بالخادم');
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  async function saveAll() {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const requests = settings.map((setting) =>
        fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: setting.key, value: values[setting.key] ?? '' })
        })
      );

      const responses = await Promise.all(requests);
      const failed = responses.find((res) => !res.ok);

      if (failed) {
        const payload = await failed.json().catch(() => null);
        setError((payload as { error?: string } | null)?.error ?? 'فشل حفظ إعدادات الولاء');
      } else {
        setMessage('تم حفظ إعدادات الولاء بنجاح');
        await loadSettings();
      }
    } catch {
      setError('تعذر حفظ إعدادات الولاء');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-3xl border border-white/10 bg-[#101010] p-6 shadow-2xl">
        <h1 className="text-3xl font-black text-white">إعدادات الولاء</h1>
        <p className="mt-2 text-sm leading-7 text-[#9CA3AF]">
          التحكم بقواعد كسب واستبدال نقاط الولاء في المتجر.
        </p>
      </section>

      {message ? (
        <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-100">
          {message}
        </div>
      ) : null}

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
                className="grid gap-4 rounded-3xl border border-white/10 bg-black/20 p-4 lg:grid-cols-[1fr_220px]"
              >
                <div>
                  <div className="font-black text-white">{LABELS[setting.key] ?? setting.key}</div>
                  <div className="mt-1 text-sm leading-6 text-[#9CA3AF]">
                    {setting.description ?? setting.key}
                  </div>
                </div>

                <input
                  value={values[setting.key] ?? ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [setting.key]: e.target.value }))}
                  className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 font-mono text-white outline-none focus:border-[#C9A84C]"
                />
              </div>
            ))}

            <button
              type="button"
              disabled={saving}
              onClick={saveAll}
              className="rounded-2xl bg-[#C9A84C] px-6 py-3 text-sm font-black text-[#111111] hover:bg-[#D8B95F] disabled:opacity-50"
            >
              {saving ? 'جار الحفظ...' : 'حفظ إعدادات الولاء'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}