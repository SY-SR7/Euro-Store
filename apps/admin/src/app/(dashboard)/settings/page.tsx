'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface Setting { key: string; value: string; description: string | null }

const LABELS: Record<string, string> = {
  usd_exchange_rate:        'سعر صرف الدولار (ل.س)',
  loyalty_earn_amount_syp:  'نقاط: كل كم ل.س تُكسب نقطة',
  loyalty_earn_points:      'نقاط: عدد النقاط المكتسبة',
  loyalty_redeem_points:    'نقاط: كم نقطة = 1 ل.س',
  referral_bonus_points:    'نقاط: مكافأة الإحالة',
  max_exchange_days:        'الاستبدال: أقصى عدد أيام',
};

export default function AdminSettingsPage() {
  const t = useTranslations();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/settings');
    const data = await res.json() as Setting[];
    setSettings(Array.isArray(data) ? data : []);
    const map: Record<string, string> = {};
    for (const s of (Array.isArray(data) ? data : [])) map[s.key] = s.value;
    setValues(map);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const save = async (key: string) => {
    setSaving(key);
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: values[key] }),
    });
    setSaving(null);
    setSaved(key);
    setTimeout(() => setSaved(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-[#E2E2E2]">{t('admin.settings')}</h1>

      {loading ? (
        <p className="text-[#9CA3AF]">{t('common.loading')}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {settings.map(s => (
            <div key={s.key} className="rounded-md border border-[#2E2E2E] bg-[#151515] p-5">
              <label className="text-sm font-medium text-[#E2E2E2] block mb-1">
                {LABELS[s.key] ?? s.key}
              </label>
              {s.description && (
                <p className="text-xs text-[#6B7280] mb-3">{s.description}</p>
              )}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={values[s.key] ?? ''}
                  onChange={e => setValues(v => ({ ...v, [s.key]: (e.target as HTMLInputElement).value }))}
                  className="flex-1 rounded border border-[#2E2E2E] bg-[#0F0F0F] px-3 py-2 text-sm text-[#E2E2E2] outline-none focus:border-[#C9A84C] font-mono"
                />
                <button
                  onClick={() => save(s.key)}
                  disabled={saving === s.key}
                  className="rounded-sm bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#111] hover:bg-[#D8B95F] disabled:opacity-50 transition-colors min-w-[80px]"
                >
                  {saved === s.key ? '✓' : saving === s.key ? '...' : t('common.save')}
                </button>
              </div>
            </div>
          ))}
          {settings.length === 0 && (
            <p className="text-[#9CA3AF] text-sm">{t('common.noData')}</p>
          )}
        </div>
      )}
    </div>
  );
}
