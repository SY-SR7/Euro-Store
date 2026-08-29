'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { CheckCircle2, ImageIcon, RefreshCw, ScanLine, Truck } from 'lucide-react';

type ProductSnapshot = {
  sku?: string;
  name_ar?: string;
  name_en?: string;
};

type ExchangeRequest = {
  id: string;
  status: string;
  partner_stage?: string | null;
  reason?: string | null;
  created_at: string;
  catalog_image_url?: string | null;
  order_items?: {
    quantity?: number;
    product_snapshot?: ProductSnapshot | null;
  } | null;
  exchange_request_images?: Array<{ id: string; url: string | null }>;
};

export function PartnerExchangeRequestsClient() {
  const t = useTranslations('partner');
  const locale = useLocale();
  const [requests, setRequests] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/partner/exchanges', { cache: 'no-store' });
      const payload = await response.json().catch(() => null) as { data?: ExchangeRequest[]; error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? 'load_failed');
      setRequests(Array.isArray(payload?.data) ? payload.data : []);
    } catch {
      setError(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  async function runStep(id: string, path: string) {
    setUpdating(id);
    setError('');
    try {
      const response = await fetch(`/api/partner/exchanges/${id}/${path}`, { method: 'POST' });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? 'update_failed');
      await loadRequests();
    } catch {
      setError(t('updateError'));
    } finally {
      setUpdating(null);
    }
  }

  function statusLabel(request: ExchangeRequest) {
    if (request.status === 'approved') {
      return t(`stages.${request.partner_stage ?? 'awaiting_customer'}` as never);
    }
    return t(`statuses.${request.status}` as never);
  }

  function nextAction(request: ExchangeRequest) {
    const stage = request.partner_stage ?? 'awaiting_customer';
    if (request.status === 'approved' && stage === 'awaiting_customer') {
      return { icon: ScanLine, label: t('scanToReceive'), path: 'scan' };
    }
    if (request.status === 'approved' && stage === 'received_from_customer') {
      return { icon: Truck, label: t('markReady'), path: 'ready-for-pickup' };
    }
    if (request.status === 'approved' && stage === 'ready_for_pickup') {
      return { icon: CheckCircle2, label: t('confirmPickup'), path: 'confirm-delivery-pickup' };
    }
    return null;
  }

  return (
    <section>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('assignedRequests')}</h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">{t('assignedRequestsDescription')}</p>
        </div>
        <button type="button" onClick={() => void loadRequests()} disabled={loading} title={t('refresh')}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-[#3A3A3A] text-[#D6D3C7] hover:border-primary hover:text-primary disabled:opacity-50">
          <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && <p role="alert" className="mb-4 rounded-md border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">{error}</p>}

      {!loading && requests.length === 0 ? (
        <div className="border-y border-[#2E2E2E] py-14 text-center text-[#9CA3AF]">{t('noAssignedRequests')}</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {requests.map((request) => {
            const snapshot = request.order_items?.product_snapshot ?? {};
            const action = nextAction(request);
            const ActionIcon = action?.icon;
            const imageUrl = request.exchange_request_images?.[0]?.url || request.catalog_image_url;
            const productName = locale === 'en'
              ? snapshot.name_en || snapshot.name_ar
              : snapshot.name_ar || snapshot.name_en;
            return (
              <article key={request.id} className="rounded-lg border border-[#2E2E2E] bg-[#171717] p-4">
                <div className="flex gap-4">
                  <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-md bg-[#222] text-[#777]">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} alt={productName || t('itemImage')} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : <ImageIcon size={24} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-bold text-white">{productName || t('exchangeItem')}</p>
                      <span className="shrink-0 rounded-full bg-[#292929] px-2 py-1 text-xs text-[#D6D3C7]">{statusLabel(request)}</span>
                    </div>
                    <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs">
                      <dt className="text-[#888]">SKU</dt><dd className="font-mono text-primary">{snapshot.sku || '-'}</dd>
                      <dt className="text-[#888]">{t('quantity')}</dt><dd>{request.order_items?.quantity ?? 1}</dd>
                      <dt className="text-[#888]">{t('submittedAt')}</dt><dd>{new Date(request.created_at).toLocaleDateString(locale === 'en' ? 'en-GB' : 'ar-SY')}</dd>
                    </dl>
                  </div>
                </div>

                {request.reason && <p className="mt-3 text-sm text-[#B8B2A8]"><span className="font-semibold text-[#E2E2E2]">{t('reason')}:</span> {request.reason}</p>}

                <div className="mt-4 border-t border-[#2E2E2E] pt-3">
                  <p className="text-xs font-bold text-[#E2E2E2]">{t('conditionChecklist')}</p>
                  <ul className="mt-2 space-y-1 text-xs text-[#9CA3AF]">
                    <li>{t('conditionOriginal')}</li>
                    <li>{t('conditionTags')}</li>
                    <li>{t('conditionSku')}</li>
                  </ul>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#2E2E2E] pt-4">
                  <span className="font-mono text-xs text-[#777]">{request.id.slice(0, 8)}</span>
                  {action?.path === 'scan' && ActionIcon ? (
                    <Link href="/exchange" className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-bold text-[#0F0F0F]">
                      <ActionIcon size={14} />
                      {action.label}
                    </Link>
                  ) : action && ActionIcon ? (
                    <button type="button" onClick={() => void runStep(request.id, action.path)} disabled={updating === request.id}
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-bold text-[#0F0F0F] disabled:opacity-50">
                      <ActionIcon size={14} />
                      {updating === request.id ? t('updating') : action.label}
                    </button>
                  ) : <span className="text-xs text-[#777]">{t('noAction')}</span>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
