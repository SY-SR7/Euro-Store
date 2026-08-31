/// <reference lib="dom" />
'use client';
import { useState } from 'react';
import { Camera, CheckCircle2, PackageCheck, RotateCcw, ScanLine, Truck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { QRScanner } from '../QRScanner';

type ScanState = 'idle' | 'scanning' | 'processing' | 'done';

type PartnerExchange = {
  id: string;
  status: string;
  partner_stage?: string | null;
  reason?: string | null;
  reason_ar?: string | null;
  order_items?: { product_snapshot?: Record<string, unknown> | null; quantity?: number | null } | null;
};

interface RedeemResult {
  ok: boolean;
  message: string;
  exchange?: PartnerExchange;
}

export default function PartnerExchangePage() {
  const t = useTranslations('partner');
  const [state,   setState]   = useState<ScanState>('idle');
  const [result,  setResult]  = useState<RedeemResult | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [showManual,  setShowManual]  = useState(false);
  const [verifiedToken, setVerifiedToken] = useState('');

  async function processToken(token: string) {
    setState('processing');
    setResult(null);
    try {
      const res  = await fetch('/api/partner/exchanges/scan-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json() as { error?: string; exchange?: PartnerExchange };
      if (res.ok) {
        setVerifiedToken(token.trim());
        setResult({ ok: true, message: t('tokenVerified'), exchange: data.exchange });
      } else {
        setVerifiedToken('');
        setResult({ ok: false, message: errorMessage(data.error) });
      }
    } catch {
      setResult({ ok: false, message: t('serverConnectionError') });
    } finally {
      setState('done');
    }
  }

  async function handleScan(raw: string) {
    setState('idle');
    await processToken(raw);
  }

  async function handleManualSubmit() {
    if (!manualToken.trim()) return;
    await processToken(manualToken);
    setManualToken('');
    setShowManual(false);
  }

  async function runStep(path: string, successMessage: string) {
    if (!result?.exchange) return;
    setState('processing');
    try {
      const requiresToken = path === 'confirm-receipt';
      if (requiresToken && !verifiedToken) {
        setResult((current) => current ? { ...current, ok: false, message: t('qrRequired') } : current);
        return;
      }
      const res = await fetch(`/api/partner/exchanges/${result.exchange.id}/${path}`, {
        method: 'POST',
        ...(requiresToken ? {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: verifiedToken }),
        } : {}),
      });
      const data = await res.json() as { error?: string; exchange?: PartnerExchange };
      if (!res.ok) {
        setResult((current) => current ? { ...current, ok: false, message: errorMessage(data.error) } : current);
        return;
      }
      setResult({ ok: true, message: successMessage, exchange: data.exchange ?? result.exchange });
      if (requiresToken) setVerifiedToken('');
    } catch {
      setResult((current) => current ? { ...current, ok: false, message: t('serverConnectionError') } : current);
    } finally {
      setState('done');
    }
  }

  function nextStep(exchange: PartnerExchange) {
    const stage = exchange.partner_stage ?? 'awaiting_customer';
    if (exchange.status === 'approved' && stage === 'awaiting_customer') {
      return {
        icon: PackageCheck,
        label: t('confirmReceiptFromCustomer'),
        onClick: () => { void runStep('confirm-receipt', t('receiptConfirmed')); },
      };
    }
    if (exchange.status === 'approved' && stage === 'received_from_customer') {
      return {
        icon: Truck,
        label: t('markReadyForDelivery'),
        onClick: () => { void runStep('ready-for-pickup', t('readyConfirmed')); },
      };
    }
    if (exchange.status === 'approved' && stage === 'ready_for_pickup') {
      return {
        icon: CheckCircle2,
        label: t('confirmDeliveryPickup'),
        onClick: () => { void runStep('confirm-delivery-pickup', t('deliveryPickupConfirmed')); },
      };
    }
    return null;
  }

  function statusLabel(status: string) {
    const labels: Record<string, string> = {
      approved: t('statuses.approved'),
      item_received_by_shipping: t('statuses.item_received_by_shipping'),
      completed: t('statuses.completed'),
      rejected: t('statuses.rejected'),
    };
    return labels[status] ?? status;
  }

  function stageLabel(stage?: string | null) {
    const labels: Record<string, string> = {
      awaiting_customer: t('stages.awaiting_customer'),
      received_from_customer: t('stages.received_from_customer'),
      ready_for_pickup: t('stages.ready_for_pickup'),
      picked_up_by_delivery: t('stages.picked_up_by_delivery'),
    };
    return labels[stage ?? 'awaiting_customer'] ?? (stage ?? t('stages.awaiting_customer'));
  }

  function errorMessage(code?: string) {
    if (!code) return t('updateError');
    const known = [
      'invalid_token', 'token_not_found', 'token_already_used', 'token_expired', 'token_mismatch',
      'assigned_to_other_partner', 'not_partner_path', 'invalid_status', 'invalid_stage',
      'inactive_partner', 'qr_token_required', 'concurrent_transition', 'receipt_failed',
    ];
    return known.includes(code) ? t(`errors.${code}` as never) : t('updateError');
  }

  function reset() {
    setState('idle');
    setResult(null);
    setManualToken('');
    setShowManual(false);
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-text-primary">
      {/* QR Scanner Overlay */}
      {state === 'scanning' && (
        <QRScanner
          title={t('scannerTitle')}
          description={t('scannerDescription')}
          onScan={(raw) => { void handleScan(raw); }}
          onClose={() => setState('idle')}
        />
      )}

      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-semibold mb-2">{t('receiveExchangeTitle')}</h1>
        <p className="text-sm text-text-secondary mb-8">{t('receiveExchangeDescription')}</p>

        {/* Result */}
        {result && (
          <div className={`mb-6 rounded-xl border px-5 py-4 ${
            result.ok
              ? 'bg-green-900/30 border-green-700 text-green-300'
              : 'bg-red-900/30 border-red-700 text-red-300'
          }`}>
            <p className="font-bold text-base">{result.message}</p>
            {result.exchange && (
              <div className="mt-3 space-y-2 text-sm text-[#D6D3C7]">
                <div className="flex items-center justify-between gap-3 rounded-lg bg-background-secondary px-3 py-2">
                  <span className="text-text-secondary">{t('status')}</span>
                  <span className="font-bold text-primary">{statusLabel(result.exchange.status)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg bg-background-secondary px-3 py-2">
                  <span className="text-text-secondary">{t('partnerStage')}</span>
                  <span className="font-bold text-primary">{stageLabel(result.exchange.partner_stage)}</span>
                </div>
                <div className="rounded-lg bg-background-secondary px-3 py-2">
                  <p className="text-text-secondary">{t('reason')}</p>
                  <p>{result.exchange.reason ?? result.exchange.reason_ar ?? t('notAvailable')}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Actions */}
        {state !== 'processing' && (
          <div className="space-y-4">
            {/* Camera Scan Button */}
            <button
              onClick={() => setState('scanning')}
              className="w-full flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-background-elevated p-10 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <Camera size={56} className="text-primary" />
              <div className="text-center">
                <p className="font-bold text-lg text-text-primary">{t('scanWithCamera')}</p>
                <p className="text-sm text-text-secondary mt-1">{t('scanWithCameraDescription')}</p>
              </div>
            </button>

            {/* Manual fallback */}
            {!showManual ? (
              <button
                onClick={() => setShowManual(true)}
                className="w-full text-center text-sm text-text-secondary hover:text-primary transition-colors py-2"
              >
                {t('enterTokenManually')}
              </button>
            ) : (
              <div className="space-y-3 rounded-xl border border-border bg-background-elevated p-5">
                <label className="text-sm text-text-secondary">{t('pasteToken')}</label>
                <textarea
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-xs font-mono text-text-primary h-28 resize-none focus:border-primary focus:outline-none"
                  value={manualToken}
                  onChange={e => setManualToken(e.currentTarget.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowManual(false)}
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm text-text-secondary">
                    {t('cancel')}
                  </button>
              <button
                onClick={() => { void handleManualSubmit(); }}
                disabled={!manualToken.trim()}
                    className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-text-primary hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    {t('confirm')}
                  </button>
                </div>
              </div>
            )}

            {result?.ok && result.exchange && nextStep(result.exchange) && (
              <button
                onClick={nextStep(result.exchange)!.onClick}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-text-primary hover:bg-primary-dark transition-colors"
              >
                {(() => {
                  const Icon = nextStep(result.exchange)!.icon;
                  return <Icon size={17} />;
                })()}
                {nextStep(result.exchange)!.label}
              </button>
            )}

            {result && (
              <button
                onClick={reset}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-bold text-text-secondary hover:border-primary hover:text-primary transition-colors"
              >
                <RotateCcw size={16} />
                {t('newOperation')}
              </button>
            )}
          </div>
        )}

        {/* Processing State */}
        {state === 'processing' && (
          <div className="text-center py-12 space-y-4">
            <ScanLine size={42} className="mx-auto animate-pulse text-primary" />
            <p className="text-text-secondary">{t('verifyingToken')}</p>
          </div>
        )}
      </div>
    </main>
  );
}
