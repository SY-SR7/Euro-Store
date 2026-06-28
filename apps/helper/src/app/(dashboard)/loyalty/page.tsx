'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function HelperLoyaltyPage() {
  const t = useTranslations();

  const [customerId,  setCustomerId]  = useState('');
  const [points,      setPoints]      = useState('');
  const [description, setDescription] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [msg,         setMsg]         = useState<{ ok: boolean; text: string } | null>(null);

  async function handleGrant() {
    setLoading(true); setMsg(null);
    try {
      const res  = await fetch('/api/loyalty/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId.trim(),
          points     : parseInt(points, 10),
          description: description.trim() || undefined,
        }),
      });
      const data = await res.json() as { error?: string };
      if (res.ok) { setMsg({ ok: true, text: 'تم منح النقاط بنجاح ✓' }); setCustomerId(''); setPoints(''); setDescription(''); }
      else        setMsg({ ok: false, text: data.error ?? 'خطأ' });
    } catch { setMsg({ ok: false, text: 'تعذّر الاتصال' }); }
    finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-6 py-12 text-[#E2E2E2]">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-semibold mb-2">{t('helper.grantLoyalty')}</h1>
        <p className="text-sm text-[#9CA3AF] mb-8">{t('helper.grantLoyaltyDesc')}</p>

        {msg && (
          <div className={`mb-6 rounded-md border px-4 py-3 text-sm ${msg.ok ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-red-900/30 border-red-700 text-red-300'}`}>
            {msg.text}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#9CA3AF]">{t('helper.customerId')}</label>
            <input
              className="rounded-md border border-[#2E2E2E] bg-[#151515] px-4 py-2.5 text-sm focus:border-[#C9A84C] focus:outline-none"
              value={customerId} onChange={e => setCustomerId(e.target.value)} placeholder="UUID"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#9CA3AF]">{t('helper.pointsToGrant')}</label>
            <input
              type="number" min="1"
              className="rounded-md border border-[#2E2E2E] bg-[#151515] px-4 py-2.5 text-sm focus:border-[#C9A84C] focus:outline-none"
              value={points} onChange={e => setPoints(e.target.value)} placeholder="100"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#9CA3AF]">{t('helper.grantDescription')} ({t('common.optional')})</label>
            <input
              className="rounded-md border border-[#2E2E2E] bg-[#151515] px-4 py-2.5 text-sm focus:border-[#C9A84C] focus:outline-none"
              value={description} onChange={e => setDescription(e.target.value)} placeholder={t('helper.grantDescPlaceholder')}
            />
          </div>
          <button
            onClick={handleGrant}
            disabled={loading || !customerId.trim() || !points}
            className="rounded-md bg-[#C9A84C] px-6 py-2.5 font-semibold text-[#0F0F0F] hover:bg-[#A67C2E] transition-colors disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('helper.grantLoyalty')}
          </button>
        </div>
      </div>
    </main>
  );
}