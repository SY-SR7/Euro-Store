'use client';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { PlusCircle, PackageSearch, Clock, CheckCircle2, XCircle, Inbox } from 'lucide-react';

interface ProductRequest {
  id: string;
  product_name_ar: string;
  product_name_en: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
}

const STATUS_STYLE = {
  pending:  'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_ICON = { pending: Clock, approved: CheckCircle2, rejected: XCircle };

export default function HelperProductRequestsList() {
  const t = useTranslations('helper');
  const locale = useLocale();
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchRequests() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/helper/product-requests');
        if (!res.ok) throw new Error('request_failed');
        const data = await res.json() as ProductRequest[];
        setRequests(Array.isArray(data) ? data : []);
      } catch {
        setError(t('productRequestsLoadError'));
      } finally {
        setLoading(false);
      }
    }
    void fetchRequests();
  }, [t]);

  return (
    <div className="space-y-6 p-6 min-h-screen text-[#E2E2E2]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PackageSearch className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-white">{t('productRequestsTitle')}</h1>
        </div>
        <Link href="/product-requests/new" className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#D8B95F]">
          <PlusCircle className="h-4 w-4" />
          {t('newRequest')}
        </Link>
      </div>

      {loading ? (
        <p className="py-8 text-center text-text-muted">{t('loading')}</p>
      ) : error ? (
        <p className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-center text-sm text-red-300">{error}</p>
      ) : requests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#333] p-16 text-center text-[#9CA3AF]">
          <Inbox className="mx-auto mb-3 h-10 w-10" aria-hidden="true" />
          <p>{t('noProductRequests')}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requests.map(req => {
            const Icon = STATUS_ICON[req.status];
            return (
              <div key={req.id} className="space-y-3 rounded-lg border border-[#333] bg-[#1A1A1A] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-white text-lg">{locale === 'ar' ? req.product_name_ar : (req.product_name_en || req.product_name_ar)}</p>
                    {locale === 'ar' && req.product_name_en && <p className="text-sm text-[#9CA3AF]" dir="ltr">{req.product_name_en}</p>}
                  </div>
                  <span className={`flex items-center gap-1 shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[req.status]}`}>
                    <Icon className="h-3 w-3" />
                    {t(`productRequestStatuses.${req.status}`)}
                  </span>
                </div>

                <p className="text-xs text-[#9CA3AF]">
                  {t('requestDate', { date: new Date(req.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SY' : 'en-US') })}
                </p>

                {req.admin_notes && (
                  <div className="mt-3 rounded-lg border border-[#444] bg-[#2A2A2A] p-3 text-sm">
                    <p className="mb-1 text-xs font-semibold text-[#888]">{t('adminNote')}</p>
                    <p className="text-[#E2E2E2]">{req.admin_notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
