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
    setMsg(res.ok ? 'ØªÙ… Ø­ÙØ¸ Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø¨ÙØ¬Ø§Ø­ œ“' : 'Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«ÙØ§Ø¡ Ø§Ù„Ø­ÙØ¸');
    setSaving(false);
  }

  const LABELS: Record<string, string> = {
    loyalty_earn_amount_syp:        'Ø§Ù„Ù…Ø¨Ù„Øº (Ù„.Ø³) Ù„Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ ÙÙ‚Ø·Ø©',
    loyalty_earn_points:            'Ø¹Ø¯Ø¯ Ø§Ù„ÙÙ‚Ø§Ø· Ø§Ù„Ù…Ù…ÙÙˆØ­Ø© Ù„ÙƒÙ„ Ù…Ø¨Ù„Øº',
    loyalty_redeem_points_per_syp:  'Ø¹Ø¯Ø¯ Ø§Ù„ÙÙ‚Ø§Ø· Ù„ÙƒÙ„ Ù„ÙŠØ±Ø© Ø¹ÙØ¯ Ø§Ù„Ø§Ø³ØªØ¨Ø¯Ø§Ù„',
    loyalty_max_redeem_percent:     'Ø£Ù‚ØµÙ‰ ÙØ³Ø¨Ø© Ø®ØµÙ… Ù…Ù Ø§Ù„Ø·Ù„Ø¨ (%)',
    loyalty_referral_bonus_points:  'ÙÙ‚Ø§Ø· Ù…ÙƒØ§ÙØ£Ø© Ø§Ù„Ø¥Ø­Ø§Ù„Ø©',
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#E2E2E2]">Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø¨Ø±ÙØ§Ù…Ø¬ Ø§Ù„ÙˆÙ„Ø§Ø¡</h1>
        {msg && <p className="text-sm text-green-400">{msg}</p>}
      </div>

      <p className="text-sm text-[#9CA3AF]">
        ØªØ­ÙƒÙ… Ø¨Ù‚ÙˆØ§Ø¹Ø¯ ÙƒØ³Ø¨ ÙˆØ§Ø³ØªØ¨Ø¯Ø§Ù„ ÙÙ‚Ø§Ø· Ø§Ù„ÙˆÙ„Ø§Ø¡. ÙŠØªÙ… ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„ØªØºÙŠÙŠØ±Ø§Øª ÙÙˆØ±Ø§Ù‹ Ø¹Ù„Ù‰ Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©.
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
                onChange={e => setValues(v => ({ ...v, [s.key]: (e.target as unknown as HTMLInputElement).value }))}
                className="input-admin w-48"
              />
            </div>
          ))}

          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-sm bg-[#C9A84C] px-6 py-2.5 text-sm font-semibold text-[#111] hover:bg-[#D8B95F] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø­ÙØ¸...' : t('common.save')}
          </button>
        </div>
      )}
    </div>
  );
}
