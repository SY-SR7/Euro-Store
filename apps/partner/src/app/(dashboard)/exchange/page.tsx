/// <reference lib="dom" />
'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function PartnerExchangePage() {
  const t = useTranslations();

  const [token,      setToken]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState<{ success: boolean; message: string } | null>(null);

  async function handleRedeem() {
    if (!token.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res  = await fetch('/api/exchange/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json() as { error?: string };
      if (res.ok) setResult({ success: true,  message: 'تم تأكيد الاستبدال بنجاح ✓' });
      else        setResult({ success: false, message: data.error ?? 'خطأ غير معروف' });
    } catch {
      setResult({ success: false, message: 'تعذّر الاتصال بالخادم' });
    } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-6 py-12 text-[#E2E2E2]">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-semibold mb-2">{t('partner.exchangeScanner')}</h1>
        <p className="text-sm text-[#9CA3AF] mb-8">{t('partner.exchangeScannerDesc')}</p>

        {result && (
          <div className={`mb-6 rounded-md border px-4 py-3 text-sm ${
            result.success ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-red-900/30 border-red-700 text-red-300'
          }`}>
            {result.message}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <label className="text-sm text-[#9CA3AF]">{t('partner.pasteToken')}</label>
          <textarea
            className="rounded-md border border-[#2E2E2E] bg-[#151515] px-4 py-3 text-xs font-mono text-[#E2E2E2] h-32 resize-none focus:border-[#C9A84C] focus:outline-none"
            value={token}
            onChange={(e) => setToken((e.target as HTMLInputElement).value)}
            placeholder={t('partner.tokenPlaceholder')}
          />
          <button
            onClick={handleRedeem}
            disabled={loading || !token.trim()}
            className="rounded-md bg-[#C9A84C] px-6 py-2.5 font-semibold text-[#0F0F0F] hover:bg-[#A67C2E] transition-colors disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('partner.redeemExchange')}
          </button>
        </div>
      </div>
    </main>
  );
}
