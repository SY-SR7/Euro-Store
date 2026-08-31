'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, ScanLine, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface QueueItem { id: string; status: string; partner_stage?: string | null; }

export default function PartnerDashboardPage() {
  const t = useTranslations('partner');
  const [queue, setQueue]   = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch('/api/partner/exchanges')
      .then(r => r.json())
      .then((payload: { data?: QueueItem[] }) => { if (Array.isArray(payload.data)) setQueue(payload.data); })
      .catch(() => setQueue([]))
      .finally(() => setLoading(false));
  }, []);

  const pending = queue.filter(q => q.status === 'approved' && q.partner_stage === 'awaiting_customer').length;
  const inTransit = queue.filter(q =>
    ['received_from_customer', 'ready_for_pickup', 'picked_up_by_delivery'].includes(q.partner_stage ?? '') ||
    q.status === 'item_received_by_shipping'
  ).length;

  return (
    <main className="min-h-screen bg-background p-8 text-text-primary">
      <h1 className="text-2xl font-semibold mb-6">{t('dashboardTitle')}</h1>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border border-border bg-background-elevated p-5 text-center">
          <p className="text-4xl font-black text-primary mb-1">
            {loading ? '…' : queue.length}
          </p>
          <p className="text-sm text-text-secondary">{t('totalRequests')}</p>
        </div>
        <div className={`rounded-xl border p-5 text-center ${
          pending > 0 ? 'border-amber-700/40 bg-amber-900/15' : 'border-border bg-background-elevated'
        }`}>
          <p className={`text-4xl font-black mb-1 ${pending > 0 ? 'text-amber-400' : 'text-primary'}`}>
            {loading ? '…' : pending}
          </p>
          <p className="text-sm text-text-secondary">{t('awaitingReceipt')}</p>
        </div>
        <div className="rounded-xl border border-border bg-background-elevated p-5 text-center">
          <p className="text-4xl font-black text-green-400 mb-1">
            {loading ? '…' : inTransit}
          </p>
          <p className="text-sm text-text-secondary">{t('inProgress')}</p>
        </div>
      </div>

      {/* Alert if pending */}
      {!loading && pending > 0 && (
        <Link href="/exchange"
          className="flex items-center gap-4 rounded-xl border border-amber-700/40 bg-amber-900/20 px-5 py-4 mb-6 hover:border-amber-500 transition-colors">
          <Zap size={24} className="text-amber-300" />
          <div className="flex-1">
            <p className="font-bold text-amber-300">{t('pendingQr', { count: pending })}</p>
            <p className="text-xs text-amber-400/70">{t('openExchangeScanner')}</p>
          </div>
          <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-black text-text-primary">
            {pending}
          </span>
        </Link>
      )}

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
        <Link href="/exchange"
          className="rounded-xl border border-border bg-background-elevated p-6 hover:border-primary transition-colors">
          <ScanLine size={28} className="mb-3 text-primary" />
          <p className="font-semibold text-primary">{t('exchangeScanner')}</p>
          <p className="mt-1 text-sm text-text-secondary">{t('exchangeScannerDesc')}</p>
        </Link>
        <Link href="/exchange/history"
          className="rounded-xl border border-border bg-background-elevated p-6 hover:border-primary transition-colors">
          <ClipboardList size={28} className="mb-3 text-primary" />
          <p className="font-semibold text-primary">{t('exchangeHistory')}</p>
          <p className="mt-1 text-sm text-text-secondary">{t('exchangeHistoryDesc')}</p>
        </Link>
      </div>
    </main>
  );
}
