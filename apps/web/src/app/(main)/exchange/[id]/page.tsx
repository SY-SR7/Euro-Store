import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createPrivateStorageUrlMap } from '@eurostore/database';
import { createAdminSupabaseClient, getSessionClient } from '@/supabase-server';
import { getLocale, getTranslations } from 'next-intl/server';
import { DownloadQRButton } from '@/components/loyalty/DownloadQRButton';
import { AlertTriangle, ArrowLeft, BadgeCheck, Building2, CheckCircle2, Clock3, PackageCheck, Store, Truck, XCircle, type LucideIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';

type StatusStep = { key: string; label: string; icon: LucideIcon };

interface ExchangeDetail {
  id: string;
  status: string;
  reason: string;
  customer_whatsapp: string;
  rejection_reason: string | null;
  resolution_path: string | null;
  partner_stage: string | null;
  qr_code_url: string | null;
  qr_code_expires_at: string | null;
  qr_code_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export default async function ExchangeDetailPage({ params }: { params: { id: string } }) {
  const locale = await getLocale();
  const t = await getTranslations('exchangeDetail');
  const dateLocale = locale === 'ar' ? 'ar-SY' : 'en-GB';
  const { user } = await getSessionClient();

  if (!user) redirect('/auth/login');

  const admin = createAdminSupabaseClient();
  const { data: req, error } = await admin
    .from('exchange_requests')
    .select('id,status,reason,customer_whatsapp,rejection_reason,resolution_path,partner_stage,qr_code_url,qr_code_expires_at,qr_code_used_at,created_at,updated_at')
    .eq('id', params.id)
    .eq('customer_id', user.id)
    .maybeSingle();

  if (error || !req) notFound();

  const exchange = req as ExchangeDetail;

  const qrUrls = await createPrivateStorageUrlMap(admin, 'exchange-qr-codes', [exchange.qr_code_url]);
  const qrImageUrl = exchange.qr_code_url ? qrUrls.get(exchange.qr_code_url) ?? '' : '';
  const hasActiveQR = exchange.status === 'approved'
    && qrImageUrl
    && !exchange.qr_code_used_at
    && exchange.qr_code_expires_at
    && new Date(exchange.qr_code_expires_at) > new Date();

  const isRejected = exchange.status === 'rejected';
  const statusSteps: StatusStep[] = exchange.resolution_path === 'partner'
    ? [
        { key: 'pending', label: t('statuses.pending'), icon: Clock3 },
        { key: 'approved', label: t('statuses.approved'), icon: BadgeCheck },
        { key: 'received_from_customer', label: t('statuses.receivedFromCustomer'), icon: Store },
        { key: 'ready_for_pickup', label: t('statuses.readyForPickup'), icon: PackageCheck },
        { key: 'item_received_by_shipping', label: t('statuses.shippingReceived'), icon: Truck },
        { key: 'completed', label: t('statuses.completed'), icon: CheckCircle2 },
      ]
    : [
        { key: 'pending', label: t('statuses.pending'), icon: Clock3 },
        { key: 'approved', label: t('statuses.approved'), icon: BadgeCheck },
        { key: 'completed', label: t('statuses.completed'), icon: CheckCircle2 },
      ];
  const effectiveStatus = exchange.status === 'approved' && exchange.resolution_path === 'partner'
    ? exchange.partner_stage === 'picked_up_by_delivery' ? 'item_received_by_shipping' : exchange.partner_stage ?? 'approved'
    : exchange.status;
  const currentStepIndex = Math.max(0, statusSteps.findIndex((step) => step.key === effectiveStatus));
  const qrExpired = exchange.qr_code_expires_at
    && new Date(exchange.qr_code_expires_at) <= new Date()
    && !exchange.qr_code_used_at;
  const qrUsed = !!exchange.qr_code_used_at;

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/" className="text-primary hover:underline">{t('home')}</Link>
          <span className="text-text-muted">/</span>
          <Link href="/exchange" className="text-primary hover:underline">{t('exchangeRequests')}</Link>
          <span className="text-text-muted">/</span>
          <span className="text-text-muted font-mono text-xs">{exchange.id.slice(0, 8)}…</span>
        </div>

        <h1 className="text-2xl font-black text-text-primary">{t('title')}</h1>

        {/* Status Timeline */}
        {!isRejected ? (
          <div className="rounded-lg border border-border bg-background-card p-6 shadow-sm">
            <h2 className="text-sm font-bold text-text-muted mb-5">{t('requestStatus')}</h2>
            <div className="overflow-x-auto pb-2">
            <div className={`relative ${exchange.resolution_path === 'partner' ? 'min-w-[640px]' : 'min-w-[360px]'}`}>
              {/* Line connector */}
              <div className="absolute top-5 right-5 left-5 h-0.5 bg-border" aria-hidden="true" />
              <div className="relative flex justify-between">
                {statusSteps.map((step, i) => {
                  const done = i <= currentStepIndex;
                  const current = i === currentStepIndex;
                  return (
                    <div key={step.key} className="flex flex-col items-center gap-2 flex-1">
                      <div className={`z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-lg
                        ${done
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background text-text-muted'
                        } ${current ? 'ring-2 ring-primary/30 ring-offset-2' : ''}`}>
                        <step.icon size={18} />
                      </div>
                      <p className={`text-center text-xs leading-4 font-medium
                        ${done ? 'text-primary' : 'text-text-muted'}`}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-700" />
              <div>
                <p className="font-bold text-red-700">{t('rejectedTitle')}</p>
                {exchange.rejection_reason && (
                  <p className="text-sm text-red-600 mt-1">{t('reasonValue', { reason: exchange.rejection_reason })}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* QR Code Section — تظهر فقط عند الموافقة وقبل الانتهاء */}
        {exchange.status === 'approved' && (
          <div className="rounded-lg border-2 border-primary/30 bg-background-card p-6 shadow-sm">
            <div className="text-center space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                {t('qrTitle')}
              </p>

              {qrUsed ? (
                <div className="rounded-lg bg-green-50 border border-green-200 p-5">
                  <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-700" />
                  <p className="font-bold text-green-700">{t('qrUsed')}</p>
                  <p className="text-sm text-green-600 mt-1">
                    {t('receiptRecorded', { date: new Date(exchange.qr_code_used_at!).toLocaleDateString(dateLocale) })}
                  </p>
                </div>
              ) : qrExpired ? (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-5">
                  <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-amber-700" />
                  <p className="font-bold text-amber-700">{t('qrExpired')}</p>
                  <p className="text-sm text-amber-600 mt-1">
                    {t('qrExpiredHint')}
                  </p>
                </div>
              ) : hasActiveQR ? (
                <>
                  <p className="text-sm text-text-muted">
                    {t('showQrAt')}{' '}
                    <strong className="text-text-primary">
                      {exchange.resolution_path === 'partner' ? t('partnerStore') : t('branch')}
                    </strong>
                  </p>

                  {/* QR Image */}
                  <div className="flex justify-center">
                    <div className="rounded-2xl border-2 border-primary/20 bg-[#FFFBF5] p-3 shadow-inner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrImageUrl}
                        alt={t('qrAlt')}
                        width={220}
                        height={220}
                        className="rounded-md"
                      />
                    </div>
                  </div>

                  {/* Expiry */}
                  {exchange.qr_code_expires_at && (
                    <p className="text-xs text-text-muted">
                      {t('validUntil', {
                        date: new Date(exchange.qr_code_expires_at).toLocaleDateString(dateLocale),
                        time: new Date(exchange.qr_code_expires_at).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' }),
                      })}
                    </p>
                  )}

                  <div className="flex items-center justify-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                    <AlertTriangle size={15} /> {t('singleUseWarning')}
                  </div>

                  <DownloadQRButton dataUrl={qrImageUrl} customerName="exchange-qr" />
                </>
              ) : (
                <p className="text-sm text-text-muted py-4">{t('qrLoading')}</p>
              )}
            </div>
          </div>
        )}

        {/* Details Card */}
        <div className="rounded-lg border border-border bg-background-card p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-text-muted">{t('requestDetails')}</h2>
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-text-muted text-xs mb-1">{t('requestNumber')}</p>
              <p className="font-mono font-bold text-text-primary text-xs">{exchange.id.slice(0, 8)}…</p>
            </div>
            <div>
              <p className="text-text-muted text-xs mb-1">{t('createdAt')}</p>
              <p className="font-medium text-text-primary">{new Date(exchange.created_at).toLocaleDateString(dateLocale)}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-text-muted text-xs mb-1">{t('exchangeReason')}</p>
              <p className="text-text-primary leading-6">{exchange.reason}</p>
            </div>
            {exchange.resolution_path && (
              <div>
                <p className="text-text-muted text-xs mb-1">{t('receiptMethod')}</p>
                <p className="flex items-center gap-2 font-medium text-text-primary">
                  {exchange.resolution_path === 'partner' ? <><Store size={15} /> {t('partnerStore')}</> : <><Building2 size={15} /> {t('mainBranch')}</>}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/exchange"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-3 text-center text-sm font-bold text-text-secondary hover:border-primary hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} className="rtl:rotate-180" /> {t('backToList')}
          </Link>
          <Link
            href="/contact"
            className="flex-1 rounded-lg border border-primary/30 bg-primary/5 py-3 text-center text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
          >
            {t('contactUs')}
          </Link>
        </div>
      </div>
    </main>
  );
}
