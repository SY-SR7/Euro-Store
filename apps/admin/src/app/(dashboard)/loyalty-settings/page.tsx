'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface LoyaltySetting {
  key: string;
  value: string;
  description: string;
}

const LOYALTY_KEYS = [
  'loyalty_earn_amount_syp',
  'loyalty_earn_points',
  'loyalty_redeem_points_per_syp',
  'loyalty_max_redeem_percent',
  'loyalty_referral_bonus_points',
];

export default function AdminLoyaltySettingsPage() {
  const t = useTranslations();
  const [settings, setSettings] = useState<LoyaltySetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [values, setValues]   = useState<Record<string, string>>({});
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');

  useEffect(() => {
    void fetch('/api/settings')
      .then(r => r.json())
      .then((all: LoyaltySetting[]) => {
        const loyalty = all.filter((s: LoyaltySetting) => LOYALTY_KEYS.includes(s.key));
        setSettings(loyalty);
        const vals: Record<string, string> = {};
        loyalty.forEach((s: LoyaltySetting) => { vals[s.key] = s.value; });
        setValues(vals);
        setLoading(false);
      });
  }, []);

  async function handleSave() {
    setSaving(true); setMsg('');
    const updates = Object.entries(values).map(([key, value]) => ({ key, value }));
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });
    setMsg(res.ok ? 'تم حفظ الإعدادات بنجاح ✓' : 'حدث خطأ أثناء الحفظ');
    setSaving(false);
  }

  const LABELS: Record<string, string> = {
    loyalty_earn_amount_syp:        'المبلغ (ل.س) للحصول على نقطة',
    loyalty_earn_points:            'عدد النقاط الممنوحة لكل مبلغ',
    loyalty_redeem_points_per_syp:  'عدد النقاط لكل ليرة عند الاستبدال',
    loyalty_max_redeem_percent:     'أقصى نسبة خصم من الطلب (%)',
    loyalty_referral_bonus_points:  'نقاط مكافأة الإحالة',
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#E2E2E2]">إعدادات برنامج الولاء</h1>
        {msg && <p className="text-sm text-green-400">{msg}</p>}
      </div>

      <p className="text-sm text-[#9CA3AF]">
        تحكم بقواعد كسب واستبدال نقاط الولاء. يتم تطبيق التغييرات فوراً على الطلبات الجديدة.
      </p>

      {loading ? (
        <p className="text-[#9CA3AF]">{t('common.loading')}</p>
      ) : (
        <div className="space-y-4">
          {settings.map((s) => (
            <div key={s.key} className="rounded-lg border border-[#2E2E2E] bg-[#111] p-5">
              <label className="block text-sm font-medium text-[#E2E2E2] mb-1">
                {LABELS[s.key] ?? s.key}
              </label>
              {s.description && (
                <p className="text-xs text-[#6B7280] mb-2">{s.description}</p>
              )}
              <input
                type="number"
                value={values[s.key] ?? ''}
                onChange={e => setValues(v => ({ ...v, [s.key]: e.target.value }))}
                className="input-admin w-48"
              />
            </div>
          ))}

          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-sm bg-[#C9A84C] px-6 py-2.5 text-sm font-semibold text-[#111] hover:bg-[#D8B95F] disabled:opacity-50 transition-colors"
          >
            {saving ? 'جاري الحفظ...' : t('common.save')}
          </button>
        </div>
      )}
    </div>
  );
}