/// <reference lib="dom" />
'use client';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Camera, Check, Handshake, Inbox, Store, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { QRScanner } from '../../components/QRScanner';

// ─── Types ──────────────────────────────────────────────────
interface ExchangeRequest {
  id: string;
  order_id: string;
  customer_id: string;
  reason: string;
  status: 'pending' | 'approved';
  created_at: string;
  qr_code_expires_at: string | null;
  qr_code_used_at: string | null;
  resolution_path: string | null;
  customer_profiles: { full_name: string; phone: string } | null;
}
interface PartnerOption { id: string; business_name: string; geographic_area: string }
interface ScannedExchange extends ExchangeRequest {
  customer_whatsapp?: string | null;
}
interface InventoryOption {
  id: string;
  sku: string;
  stock_quantity: number;
  products: { name_ar: string; name_en: string };
}

type View = 'list' | 'detail' | 'scan-qr';

// ─── Helpers ─────────────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
  pending:  'bg-amber-900/40 text-amber-300 border-amber-700',
  approved: 'bg-green-900/40 text-green-300 border-green-700',
};
// ─── Component ────────────────────────────────────────────────
export default function HelperExchangePage() {
  const t = useTranslations('helper');
  const locale = useLocale();
  const [view,      setView]      = useState<View>('list');
  const [queue,     setQueue]     = useState<ExchangeRequest[]>([]);
  const [selected,  setSelected]  = useState<ExchangeRequest | null>(null);
  const [loading,   setLoading]   = useState(true);

  // Approve form
  const [path,     setPath]      = useState<'helper' | 'partner'>('helper');
  const [partnerId, setPartnerId] = useState('');
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [acting,   setActing]    = useState(false);
  const [msg,      setMsg]       = useState<{ ok: boolean; text: string } | null>(null);

  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [scannedExchange, setScannedExchange] = useState<ScannedExchange | null>(null);
  const [replacementVariantId, setReplacementVariantId] = useState('');
  const [replacementSearch, setReplacementSearch] = useState('');
  const [replacementOptions, setReplacementOptions] = useState<InventoryOption[]>([]);
  const [replacementLoading, setReplacementLoading] = useState(false);
  const [completingExchange, setCompletingExchange] = useState(false);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/helper/exchanges/review');
      const payload = await res.json() as { data?: ExchangeRequest[] };
      if (!res.ok) throw new Error('exchange_queue_failed');
      setQueue(Array.isArray(payload.data) ? payload.data : []);
    } catch {
      setQueue([]);
      setMsg({ ok: false, text: t('exchangeLoadError') });
    } finally { setLoading(false); }
  }, [t]);

  useEffect(() => {
    void fetchQueue();
    void fetch('/api/helper/partners').then((response) => response.json()).then((payload: { data?: PartnerOption[] }) => setPartners(payload.data ?? [])).catch(() => setPartners([]));
  }, [fetchQueue]);

  useEffect(() => {
    if (!scannedExchange) {
      setReplacementOptions([]);
      return;
    }
    const controller = new AbortController();
    async function loadReplacementOptions() {
      setReplacementLoading(true);
      try {
        const url = new URL('/api/helper/inventory', window.location.origin);
        if (replacementSearch.trim()) url.searchParams.set('q', replacementSearch.trim());
        const response = await fetch(url.toString(), { signal: controller.signal });
        const data = await response.json() as InventoryOption[];
        setReplacementOptions(response.ok && Array.isArray(data) ? data.filter((item) => item.stock_quantity > 0) : []);
      } catch (requestError) {
        if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) setReplacementOptions([]);
      } finally {
        if (!controller.signal.aborted) setReplacementLoading(false);
      }
    }
    const timer = window.setTimeout(() => { void loadReplacementOptions(); }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [replacementSearch, scannedExchange]);

  function openDetail(ex: ExchangeRequest) {
    setSelected(ex); setMsg(null); setShowRejectForm(false);
    setView('detail');
  }

  async function handleDecision(action: 'approve' | 'reject') {
    if (!selected) return;
    if (action === 'reject' && !rejectReason.trim()) { setMsg({ ok: false, text: t('rejectionReasonRequired') }); return; }
    if (action === 'approve' && path === 'partner' && !partnerId) { setMsg({ ok: false, text: t('partnerRequired') }); return; }
    setActing(true); setMsg(null);
    try {
      const res = await fetch(`/api/helper/exchanges/${selected.id}/${action === 'approve' ? 'approve' : 'reject'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejection_reason: action === 'reject' ? rejectReason : undefined,
          resolution_path: action === 'approve' ? path : undefined,
          partner_id: action === 'approve' && path === 'partner' ? partnerId : undefined,
        }),
      });
      const data = await res.json() as { exchange_request?: ExchangeRequest; error?: string };
      if (!res.ok) { setMsg({ ok: false, text: apiError(data.error) }); return; }

      setMsg({ ok: true, text: action === 'approve' ? t('exchangeApproved') : t('exchangeRejected') });

      if (action === 'approve') {
        setSelected({ ...selected, status: 'approved', resolution_path: path });
      }
      await fetchQueue();
    } finally { setActing(false); }
  }

  async function handleQRScan(raw: string) {
    setScanning(false);
    setScanResult(null);
    setScannedExchange(null);
    setReplacementVariantId('');
    try {
      const res  = await fetch('/api/helper/exchanges/scan-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_token: raw.trim() }),
      });
      const data = await res.json() as { error?: string; exchange_request?: ScannedExchange };
      if (res.ok) {
        setScannedExchange(data.exchange_request ?? null);
        setScanResult({ ok: true, msg: t('helperQrVerified') });
        await fetchQueue();
      } else {
        setScanResult({ ok: false, msg: apiError(data.error) });
      }
    } catch {
      setScanResult({ ok: false, msg: t('serverConnectionError') });
    }
  }

  async function completeScannedExchange() {
    if (!scannedExchange?.id || !replacementVariantId.trim()) {
      setScanResult({ ok: false, msg: t('replacementRequired') });
      return;
    }
    setCompletingExchange(true);
    try {
      const res = await fetch(`/api/helper/exchanges/${scannedExchange.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replacement_variant_id: replacementVariantId.trim() }),
      });
      const data = await res.json().catch(() => null) as { error?: string } | null;
      if (!res.ok) {
        setScanResult({ ok: false, msg: apiError(data?.error) });
        return;
      }
      setScanResult({ ok: true, msg: t('exchangeCompleted') });
      setScannedExchange(null);
      setReplacementVariantId('');
      await fetchQueue();
    } catch {
      setScanResult({ ok: false, msg: t('serverConnectionError') });
    } finally {
      setCompletingExchange(false);
    }
  }

  function apiError(code?: string) {
    if (!code) return t('exchangeActionError');
    const known = [
      'invalid_input', 'partner_id_required', 'already_processed', 'partner_not_found',
      'invalid_token', 'token_not_found', 'token_already_used', 'token_expired', 'token_mismatch',
      'exchange_not_found', 'not_helper_path', 'invalid_status', 'inactive_helper',
      'replacement_out_of_stock', 'replacement_unavailable', 'exchange_completion_failed',
    ];
    return known.includes(code) ? t(`exchangeErrors.${code}` as never) : t('exchangeActionError');
  }

  const statusLabel = (status: string) => status === 'pending'
    ? t('exchangeStatuses.pending')
    : status === 'approved' ? t('exchangeStatuses.approved') : status;

  // ─── RENDER ─────────────────────────────────────────────────

  if (scanning) {
    return (
      <QRScanner
        title={t('helperScannerTitle')}
        description={t('helperScannerDescription')}
        onScan={(raw) => { void handleQRScan(raw); }}
        onClose={() => setScanning(false)}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-6 py-10 text-[#E2E2E2]">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            {view !== 'list' && (
              <button onClick={() => { setView('list'); setSelected(null); setScanResult(null); }}
                className="mb-2 text-xs text-primary hover:underline flex items-center gap-1">
                <ArrowLeft size={14} className="rtl:rotate-180" /> {t('backToList')}
              </button>
            )}
            <h1 className="text-2xl font-semibold">
              {view === 'list' ? t('exchangeRequestsTitle') : t('exchangeRequestId', { id: selected?.id.slice(0, 8) ?? '' })}
            </h1>
          </div>
          <button
            onClick={() => { setScanning(true); setScanResult(null); }}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-[#0F0F0F] hover:bg-[#A67C2E] transition-colors"
          >
            <Camera size={16} /> {t('scanQr')}
          </button>
        </div>

        {/* Scan Result Banner */}
        {scanResult && (
          <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
            scanResult.ok ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-red-900/30 border-red-700 text-red-300'
          }`}>
            {scanResult.msg}
            <button onClick={() => setScanResult(null)} className="ms-3 opacity-60 hover:opacity-100" aria-label={t('close')}><X size={14} /></button>
          </div>
        )}

        {scannedExchange && (
          <div className="mb-5 space-y-3 rounded-xl border border-[#2E2E2E] bg-[#151515] p-4">
            <div>
              <p className="text-xs text-[#9CA3AF]">{t('exchangeRequest')}</p>
              <p className="font-mono text-sm text-primary">{scannedExchange.id}</p>
            </div>
            <div>
              <p className="text-xs text-[#9CA3AF]">{t('customer')}</p>
              <p className="text-sm text-[#E2E2E2]">{scannedExchange.customer_profiles?.full_name ?? t('notAvailable')}</p>
              <p className="text-xs text-[#9CA3AF]" dir="ltr">{scannedExchange.customer_whatsapp ?? scannedExchange.customer_profiles?.phone ?? ''}</p>
            </div>
            <label className="block text-xs font-bold text-[#9CA3AF]">
              {t('replacementProduct')}
              <input
                value={replacementSearch}
                onChange={(event) => setReplacementSearch(event.currentTarget.value)}
                className="mt-2 w-full rounded-xl border border-[#2E2E2E] bg-[#0F0F0F] px-4 py-3 text-sm text-[#E2E2E2] outline-none focus:border-primary"
                placeholder={t('replacementSearchPlaceholder')}
              />
            </label>
            <div className="max-h-56 space-y-2 overflow-y-auto" aria-busy={replacementLoading}>
              {replacementLoading ? <p className="py-3 text-center text-xs text-[#9CA3AF]">{t('inventorySearching')}</p> : null}
              {!replacementLoading && replacementOptions.length === 0 ? <p className="py-3 text-center text-xs text-[#9CA3AF]">{t('inventoryNoResults')}</p> : null}
              {replacementOptions.map((option) => {
                const name = locale === 'ar' ? option.products.name_ar : option.products.name_en;
                const selectedOption = replacementVariantId === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setReplacementVariantId(option.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-start text-sm ${selectedOption ? 'border-primary bg-primary/10' : 'border-[#2E2E2E] bg-[#0F0F0F]'}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-[#E2E2E2]">{name || option.sku}</span>
                      <span className="text-xs text-[#9CA3AF]" dir="ltr">{option.sku}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-[#9CA3AF]">
                      {t('availableCount', { count: option.stock_quantity })}
                      {selectedOption ? <Check size={16} className="text-primary" /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => { void completeScannedExchange(); }}
              disabled={completingExchange || !replacementVariantId.trim()}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-[#0F0F0F] disabled:opacity-50"
            >
              {completingExchange ? t('completingExchange') : t('completeExchange')}
            </button>
          </div>
        )}

        {/* ─── LIST VIEW ─── */}
        {view === 'list' && (
          loading ? <p className="text-[#9CA3AF]">{t('loading')}</p>
          : queue.length === 0 ? (
            <div className="rounded-xl border border-[#2E2E2E] bg-[#151515] p-10 text-center">
              <Inbox className="mx-auto mb-3 h-10 w-10 text-[#6B7280]" />
              <p className="text-[#9CA3AF]">{t('noExchangeRequests')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {queue.map(ex => (
                <button key={ex.id}
                  onClick={() => { openDetail(ex); }}
                  className="w-full text-start rounded-xl border border-[#2E2E2E] bg-[#151515] p-5 hover:border-primary/50 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#E2E2E2] truncate">
                        {ex.customer_profiles?.full_name ?? ex.customer_id.slice(0, 8)}
                      </p>
                      <p className="mt-1 text-sm text-[#9CA3AF] line-clamp-1">{ex.reason}</p>
                      <p className="mt-1 text-xs text-[#6B7280]">
                        {new Date(ex.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SY' : 'en-GB')}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${STATUS_BADGE[ex.status] ?? ''}`}>
                      {statusLabel(ex.status)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )
        )}

        {/* ─── DETAIL VIEW ─── */}
        {view === 'detail' && selected && (
          <div className="space-y-5">
            {/* Alert */}
            {msg && (
              <div className={`rounded-xl border px-4 py-3 text-sm ${
                msg.ok ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-red-900/30 border-red-700 text-red-300'
              }`}>{msg.text}</div>
            )}

            {/* Customer & Order */}
            <div className="rounded-xl border border-[#2E2E2E] bg-[#151515] p-5 space-y-3">
              <h2 className="text-xs text-[#9CA3AF] font-bold uppercase tracking-wider">{t('customerDetails')}</h2>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/20 text-primary text-xl font-bold">
                  {(selected.customer_profiles?.full_name ?? t('customer')).charAt(0)}
                </div>
                <div>
                  <p className="font-bold">{selected.customer_profiles?.full_name ?? t('notAvailable')}</p>
                  {selected.customer_profiles?.phone && (
                    <p className="text-sm text-[#9CA3AF]">{selected.customer_profiles.phone}</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-[#9CA3AF] mb-1">{t('exchangeReason')}</p>
                <p className="text-sm text-[#D6D3C7] leading-6">{selected.reason}</p>
              </div>
              <p className="text-xs text-[#6B7280]">
                {t('requestDate', { date: new Date(selected.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SY' : 'en-GB') })}
              </p>
            </div>

            {selected.status === 'pending' && !msg?.ok && (
              <div className="rounded-xl border border-[#2E2E2E] bg-[#151515] p-5 space-y-4">
                <h2 className="text-sm font-bold text-[#E2E2E2]">{t('makeDecision')}</h2>

                {/* Resolution Path */}
                <div className="space-y-2">
                  <p className="text-xs text-[#9CA3AF]">{t('resolutionMethod')}</p>
                  <div className="flex gap-2">
                    {(['helper', 'partner'] as const).map(p => (
                      <button key={p}
                        onClick={() => setPath(p)}
                        className={`flex-1 rounded-lg border py-2.5 text-sm font-bold transition-all ${
                          path === p
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-[#2E2E2E] text-[#9CA3AF] hover:border-[#3E3E3E]'
                        }`}>
                        {p === 'helper' ? <><Store size={15} /> {t('branch')}</> : <><Handshake size={15} /> {t('partner')}</>}
                      </button>
                    ))}
                  </div>
                  {path === 'partner' ? (
                    <select aria-label={locale === 'ar' ? 'الشريك المسؤول' : 'Assigned partner'} value={partnerId} onChange={(event) => setPartnerId(event.target.value)} className="w-full rounded-lg border border-[#2E2E2E] bg-[#0F0F0F] px-3 py-2.5 text-sm text-[#E2E2E2]">
                      <option value="">{t('selectPartner')}</option>
                      {partners.map((partner) => <option key={partner.id} value={partner.id}>{partner.business_name} - {partner.geographic_area}</option>)}
                    </select>
                  ) : null}
                </div>

                {/* Approve */}
                <button
                  onClick={() => { void handleDecision('approve'); }}
                  disabled={acting || (path === 'partner' && !partnerId)}
                  className="w-full rounded-xl bg-primary py-3 font-bold text-[#0F0F0F] hover:bg-[#A67C2E] transition-colors disabled:opacity-50"
                >
                  {acting ? t('processing') : t('approveAndGenerateQr')}
                </button>

                {/* Reject */}
                {!showRejectForm ? (
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="w-full rounded-xl border border-red-800 py-2.5 text-sm font-bold text-red-400 hover:bg-red-900/20 transition-colors"
                  >
                    {t('rejectExchange')}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.currentTarget.value)}
                      placeholder={t('rejectionReasonPlaceholder')}
                      className="w-full rounded-xl border border-[#2E2E2E] bg-[#0F0F0F] px-4 py-3 text-sm text-[#E2E2E2] resize-none h-20 focus:border-red-600 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setShowRejectForm(false)}
                        className="flex-1 rounded-xl border border-[#2E2E2E] py-2.5 text-sm text-[#9CA3AF]">
                        {t('cancel')}
                      </button>
                      <button
                        onClick={() => { void handleDecision('reject'); }}
                        disabled={acting}
                        className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {acting ? t('processing') : t('confirmRejection')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
