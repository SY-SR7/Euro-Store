'use client';

import { useEffect, useState } from 'react';

interface LoyaltySetting {
  key: string;
  value: string;
  description?: string | null;
}

const LABELS: Record<string, string> = {
  loyalty_earn_amount_syp:      'المبلغ المطلوب لكسب نقاط (ل.س)',
  loyalty_earn_points:          'عدد النقاط المكتسبة',
  loyalty_redeem_points_per_syp:'نقاط الاستبدال لكل ليرة',
  loyalty_max_redeem_percent:   'أقصى نسبة استبدال بالنقاط (%)',
  loyalty_referral_bonus_points:'نقاط مكافأة الإحالة',
};

const DEFAULTS: LoyaltySetting[] = [
  { key: 'loyalty_earn_amount_syp',      value: '10000', description: 'المبلغ بالليرة السورية المطلوب لكسب نقاط.' },
  { key: 'loyalty_earn_points',          value: '1',     description: 'عدد النقاط المكتسبة عند تحقق مبلغ الكسب.' },
  { key: 'loyalty_redeem_points_per_syp',value: '1',     description: 'كم نقطة مطلوبة مقابل كل ليرة عند الاستبدال.' },
  { key: 'loyalty_max_redeem_percent',   value: '20',    description: 'أقصى نسبة خصم من الطلب يمكن دفعها بالنقاط.' },
  { key: 'loyalty_referral_bonus_points',value: '50',    description: 'نقاط مكافأة الإحالة.' },
];

export default function AdminLoyaltySettingsPage() {
  const [settings, setSettings] = useState<LoyaltySetting[]>(DEFAULTS);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState('');
  const [error,    setError]    = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/loyalty-settings', { cache: 'no-store' });
      const data = (await res.json()) as LoyaltySetting[] | { error?: string };
      if (Array.isArray(data) && data.length > 0) {
        // Merge fetched values onto defaults (to keep description fallbacks)
        setSettings(DEFAULTS.map(d => {
          const fetched = data.find((f: LoyaltySetting) => f.key === d.key);
          return fetched ? { ...d, value: fetched.value, description: fetched.description ?? d.description } : d;
        }));
      }
    } catch {
      setError('تعذر تحميل إعدادات الولاء');
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const update = (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const save = async () => {
    setSaving(true); setMsg(''); setError('');
    try {
      const res = await fetch('/api/loyalty-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings.map(s => ({ key: s.key, value: s.value }))),
      });
      if (res.ok) setMsg('تم حفظ إعدادات الولاء بنجاح ✓');
      else setError('فشل الحفظ');
    } catch {
      setError('خطأ في الاتصال بالخادم');
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6" dir="rtl">

      <div className="rounded-3xl border border-white/10 bg-[#101010] p-6">
        <h1 className="text-3xl font-black text-white">إعدادات نظام الولاء</h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">تحكم في قواعد كسب النقاط واستبدالها</p>
      </div>

      {msg   && <p className="rounded-2xl border border-green-400/20 bg-green-400/10 px-5 py-3 text-sm text-green-300">{msg}</p>}
      {error && <p className="rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-3 text-sm text-red-300">{error}</p>}

      {loading ? (
        <div className="flex justify-center p-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C9A84C] border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4">
          {settings.map(s => (
            <div key={s.key} className="rounded-3xl border border-white/10 bg-[#101010] p-5">
              <label className="flex flex-col gap-2">
                <span className="font-black text-[#EDE7DD]">{LABELS[s.key] ?? s.key}</span>
                {s.description && <span className="text-xs text-[#9CA3AF]">{s.description}</span>}
                <input
                  type="number"
                  value={s.value}
                  min={0}
                  onChange={e => update(s.key, e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#151515] px-4 py-3 text-sm text-[#EDE7DD] outline-none focus:border-[#C9A84C] transition-colors [appearance:textfield]"
                />
              </label>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <button
          onClick={() => void save()}
          disabled={saving}
          className="w-full rounded-2xl bg-[#C9A84C] px-6 py-3 font-black text-[#111] hover:bg-[#D8B95F] transition-colors disabled:opacity-50"
        >
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
      )}
    </div>
  );
}
