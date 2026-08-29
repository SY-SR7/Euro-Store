/// <reference lib="dom" />
'use client';

import { useState } from 'react';
import { AlertTriangle, Camera, CheckCircle2, RotateCcw, TrendingDown, TrendingUp, UserCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { QRScanner } from '../../components/QRScanner';

interface CustomerInfo {
  id: string;
  full_name: string;
  loyalty_points: number;
}

type Tab = 'earn' | 'redeem';
type Step = 'scan' | 'confirm' | 'done';

export default function HelperLoyaltyPage() {
  const t = useTranslations('helperLoyalty');
  const locale = useLocale();
  const numberLocale = locale === 'ar' ? 'ar-SY' : 'en-GB';
  const [tab, setTab] = useState<Tab>('earn');
  const [step, setStep] = useState<Step>('scan');
  const [scanning, setScanning] = useState(false);
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [amount, setAmount] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [preview, setPreview] = useState<{ points: number; syp?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [operationId, setOperationId] = useState<string | null>(null);

  function reset() {
    setStep('scan');
    setCustomer(null);
    setAmount('');
    setInvoiceAmount('');
    setPreview(null);
    setOperationId(null);
    setMessage(null);
  }

  function errorMessage(code?: string) {
    const known = [
      'invalid_qr_data', 'token_expired', 'customer_not_found', 'customer_blocked',
      'qr_configuration_error', 'invalid_input', 'insufficient_points', 'below_minimum',
      'redemption_limit_exceeded', 'operation_failed', 'database_error',
    ];
    return code && known.includes(code) ? t(`errors.${code}` as never) : t('errors.generic');
  }

  async function handleScan(raw: string) {
    setScanning(false);
    setMessage(null);
    setLoading(true);
    try {
      const response = await fetch('/api/helper/loyalty/scan-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_data: raw.trim() }),
      });
      const data = await response.json() as { customer?: CustomerInfo; error?: string };
      if (!response.ok || !data.customer) {
        setMessage({ ok: false, text: errorMessage(data.error) });
        return;
      }
      setCustomer(data.customer);
      setStep('confirm');
    } catch {
      setMessage({ ok: false, text: t('errors.connection') });
    } finally {
      setLoading(false);
    }
  }

  async function handlePreview() {
    if (!amount || !customer) return;
    setLoading(true);
    setMessage(null);
    try {
      const endpoint = tab === 'earn'
        ? `/api/helper/loyalty/preview-earn?amount=${encodeURIComponent(amount)}`
        : `/api/helper/loyalty/preview-redeem?points=${encodeURIComponent(amount)}&customer_id=${customer.id}&invoice_amount=${encodeURIComponent(invoiceAmount)}`;
      const response = await fetch(endpoint);
      const data = await response.json() as { points?: number; syp?: number; error?: string };
      if (!response.ok) {
        setMessage({ ok: false, text: errorMessage(data.error) });
        return;
      }
      setPreview({ points: data.points ?? 0, syp: data.syp });
      setOperationId(crypto.randomUUID());
    } catch {
      setMessage({ ok: false, text: t('errors.connection') });
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!customer || !preview || !operationId) return;
    setLoading(true);
    setMessage(null);
    try {
      const endpoint = tab === 'earn'
        ? '/api/helper/loyalty/earn-offline'
        : '/api/helper/loyalty/redeem-offline';
      const body = tab === 'earn'
        ? { operation_id: operationId, customer_id: customer.id, invoice_amount: Number.parseInt(amount, 10) }
        : {
            operation_id: operationId,
            customer_id: customer.id,
            points: Number.parseInt(amount, 10),
            invoice_amount: Number.parseInt(invoiceAmount, 10),
          };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) {
        setMessage({ ok: false, text: errorMessage(data.error) });
        return;
      }
      setMessage({
        ok: true,
        text: tab === 'earn'
          ? t('earnedSuccess', { points: preview.points.toLocaleString(numberLocale), name: customer.full_name })
          : t('redeemedSuccess', {
              points: preview.points.toLocaleString(numberLocale),
              amount: Number(preview.syp ?? 0).toLocaleString(numberLocale),
              name: customer.full_name,
            }),
      });
      setStep('done');
    } catch {
      setMessage({ ok: false, text: t('errors.connection') });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-6 py-10 text-[#E2E2E2]">
      {scanning ? (
        <QRScanner
          title={tab === 'earn' ? t('scanEarnTitle') : t('scanRedeemTitle')}
          description={t('scanDescription')}
          onScan={(raw) => { void handleScan(raw); }}
          onClose={() => setScanning(false)}
        />
      ) : null}

      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-2xl font-semibold">{t('title')}</h1>

        <div className="mb-6 flex rounded-lg border border-[#2E2E2E] bg-[#151515] p-1">
          {(['earn', 'redeem'] as Tab[]).map((value) => {
            const Icon = value === 'earn' ? TrendingUp : TrendingDown;
            return (
              <button
                key={value}
                onClick={() => { setTab(value); reset(); }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold ${tab === value ? 'bg-primary text-[#0F0F0F]' : 'text-[#9CA3AF] hover:text-[#E2E2E2]'}`}
              >
                <Icon size={16} /> {value === 'earn' ? t('earnTab') : t('redeemTab')}
              </button>
            );
          })}
        </div>

        {message && step !== 'done' ? (
          <div role="alert" className={`mb-5 rounded-lg border px-4 py-3 text-sm ${message.ok ? 'border-green-700 bg-green-900/30 text-green-300' : 'border-red-700 bg-red-900/30 text-red-300'}`}>
            {message.text}
          </div>
        ) : null}

        {step === 'scan' ? (
          <section className="rounded-lg border border-dashed border-[#3E3E3E] bg-[#151515] p-8 text-center">
            <Camera className="mx-auto mb-4 h-12 w-12 text-primary" />
            <p className="mb-6 text-sm leading-6 text-[#9CA3AF]">{tab === 'earn' ? t('earnScanHint') : t('redeemScanHint')}</p>
            <button onClick={() => setScanning(true)} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-bold text-[#0F0F0F] disabled:opacity-50">
              <Camera size={17} /> {loading ? t('loading') : t('openCamera')}
            </button>
          </section>
        ) : null}

        {step === 'confirm' && customer ? (
          <div className="space-y-4">
            <section className="rounded-lg border border-[#2E2E2E] bg-[#151515] p-5">
              <div className="flex items-center gap-3">
                <UserCircle className="h-11 w-11 text-primary" />
                <div>
                  <p className="font-bold">{customer.full_name}</p>
                  <p className="text-sm text-[#9CA3AF]">{t('balance', { points: customer.loyalty_points.toLocaleString(numberLocale) })}</p>
                </div>
              </div>
            </section>

            {tab === 'redeem' ? (
              <label className="flex flex-col gap-1.5 text-sm text-[#9CA3AF]">
                {t('invoiceBeforeDiscount')}
                <input type="number" min="1" value={invoiceAmount} onChange={(event) => { setInvoiceAmount(event.currentTarget.value); setPreview(null); setOperationId(null); }} className="rounded-lg border border-[#2E2E2E] bg-[#151515] px-4 py-3 text-lg font-bold text-[#E2E2E2] focus:border-primary focus:outline-none" placeholder="100000" />
              </label>
            ) : null}

            <label className="flex flex-col gap-1.5 text-sm text-[#9CA3AF]">
              {tab === 'earn' ? t('invoiceAmount') : t('pointsToRedeem')}
              <input type="number" min="1" value={amount} onChange={(event) => { setAmount(event.currentTarget.value); setPreview(null); setOperationId(null); }} className="rounded-lg border border-[#2E2E2E] bg-[#151515] px-4 py-3 text-lg font-bold text-[#E2E2E2] focus:border-primary focus:outline-none" placeholder={tab === 'earn' ? '100000' : '100'} />
            </label>

            {!preview && amount && (tab === 'earn' || invoiceAmount) ? (
              <button onClick={() => { void handlePreview(); }} disabled={loading} className="w-full rounded-lg border border-primary/40 py-2.5 text-sm font-bold text-primary disabled:opacity-50">
                {loading ? t('calculating') : t('calculate')}
              </button>
            ) : null}

            {preview ? (
              <section className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
                <p className="text-sm text-[#9CA3AF]">{tab === 'earn' ? t('willEarn') : t('willRedeem')}</p>
                <p className="mt-1 text-4xl font-black text-primary">{preview.points.toLocaleString(numberLocale)}</p>
                <p className="text-sm text-[#9CA3AF]">{tab === 'redeem' ? t('pointsDiscount', { amount: Number(preview.syp ?? 0).toLocaleString(numberLocale) }) : t('points')}</p>
              </section>
            ) : null}

            <div className="flex gap-3 pt-2">
              <button onClick={reset} className="flex-1 rounded-lg border border-[#2E2E2E] py-3 text-sm font-bold text-[#9CA3AF]">{t('cancel')}</button>
              <button onClick={() => { void handleConfirm(); }} disabled={loading || !preview} className="flex-1 rounded-lg bg-primary py-3 text-sm font-bold text-[#0F0F0F] disabled:opacity-50">
                {loading ? t('processing') : tab === 'earn' ? t('confirmEarn') : t('confirmRedeem')}
              </button>
            </div>
          </div>
        ) : null}

        {step === 'done' ? (
          <section className="space-y-5 rounded-lg border border-[#2E2E2E] bg-[#151515] p-7 text-center">
            {message?.ok ? <CheckCircle2 className="mx-auto h-12 w-12 text-green-400" /> : <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />}
            <p className={`font-bold ${message?.ok ? 'text-green-400' : 'text-red-400'}`}>{message?.text}</p>
            <button onClick={reset} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-bold text-[#0F0F0F]">
              <RotateCcw size={17} /> {t('newOperation')}
            </button>
          </section>
        ) : null}
      </div>
    </main>
  );
}
