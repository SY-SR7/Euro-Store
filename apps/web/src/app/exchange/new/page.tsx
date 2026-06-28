// @ts-nocheck
/* eslint-disable */
'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function NewExchangePage() {
  const t = useTranslations();

  const [orderNumber, setOrderNumber] = useState('');
  const [reason,      setReason]      = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      const res = await fetch('/api/exchange/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_number: orderNumber, reason }),
      });
      const data = await res.json() as { error?: string; exchange_request_id?: string };
      if (!res.ok) { setError(data.error ?? 'خطأ غير متوقع'); return; }
      setSuccess(`تم إنشاء طلب الاستبدال بنجاح. رقم الطلب: ${data.exchange_request_id ?? ''}`);
      setOrderNumber(''); setReason('');
    } catch { setError('تعذّر الاتصال بالخادم'); }
    finally   { setSubmitting(false); }
  }

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-6 py-12 text-[#E2E2E2]">
      <div className="mx-auto max-w-lg">
        <Link href="/" className="text-[#C9A84C] text-sm hover:underline">← {t('common.appName')}</Link>
        <h1 className="mt-6 text-2xl font-semibold">{t('exchange.newRequest')}</h1>
        <p className="mt-2 text-sm text-[#9CA3AF]">{t('exchange.newRequestDesc')}</p>

        {error   && <p className="mt-4 rounded-md bg-red-900/30 border border-red-700 px-4 py-3 text-sm text-red-300">{error}</p>}
        {success && <p className="mt-4 rounded-md bg-green-900/30 border border-green-700 px-4 py-3 text-sm text-green-300">{success}</p>}

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#9CA3AF]">{t('exchange.orderNumber')}</label>
            <input
              className="rounded-md border border-[#2E2E2E] bg-[#151515] px-4 py-2.5 text-sm text-[#E2E2E2] placeholder:text-[#6B7280] focus:border-[#C9A84C] focus:outline-none"
              value={orderNumber} onChange={e => setOrderNumber(e.target.value)}
              placeholder="ES-2026-XXXX" required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#9CA3AF]">{t('exchange.reason')}</label>
            <textarea
              className="rounded-md border border-[#2E2E2E] bg-[#151515] px-4 py-2.5 text-sm text-[#E2E2E2] placeholder:text-[#6B7280] focus:border-[#C9A84C] focus:outline-none h-28 resize-none"
              value={reason} onChange={e => setReason(e.target.value)}
              placeholder={t('exchange.reasonPlaceholder')} required
            />
          </div>
          <button
            type="submit" disabled={submitting}
            className="rounded-md bg-[#C9A84C] px-6 py-2.5 text-sm font-semibold text-[#0F0F0F] hover:bg-[#A67C2E] transition-colors disabled:opacity-50"
          >
            {submitting ? t('common.loading') : t('exchange.submit')}
          </button>
        </form>
      </div>
    </main>
  );
}