/* eslint-disable */
// @ts-nocheck
import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { createServerSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

const STATUS_COLOR: Record<string, string> = {
  pending:'bg-amber-50 text-amber-700', approved:'bg-green-50 text-green-700',
  rejected:'bg-red-50 text-red-700', completed:'bg-blue-50 text-blue-700',
};
const STATUS_LABEL: Record<string, string> = {
  pending:'معلق', approved:'مقبول', rejected:'مرفوض', completed:'مكتمل',
};

export default async function ExchangeIndexPage() {
  const t = await getTranslations('exchange');
  const locale = await getLocale();
  const isAr = locale === 'ar';
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let requests: Array<{ id: string; status: string; reason_ar: string; created_at: string }> = [];
  if (user) {
    const { data } = await supabase
      .from('exchange_requests')
      .select('id, status, reason_ar, created_at')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });
    requests = (data ?? []) as typeof requests;
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-primary hover:underline">{t('home')}</Link>
            <h1 className="mt-3 text-2xl font-black text-text-primary">{t('title')}</h1>
          </div>
          <Link href="/exchange/new"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-[#1F1B16] hover:bg-[#9A7209] transition-colors">
            + {t('newRequest')}
          </Link>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800 leading-6">
            🔄 {t('policy')}
          </p>
        </div>

        {!user ? (
          <div className="rounded-2xl border border-border bg-background-card p-8 text-center shadow-sm">
            <p className="text-text-muted mb-4">{t('loginToTrack')}</p>
            <Link href="/auth/login" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-[#1F1B16] hover:bg-[#9A7209] transition-colors">
              {t('login')}
            </Link>
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-border bg-background-card p-8 text-center shadow-sm">
            <p className="text-text-muted">{t('noRequests')}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-background-card shadow-sm">
            <div className="divide-y divide-[#F0ECE6]">
              {requests.map(req => (
                <div key={req.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-semibold text-text-primary text-sm">{req.reason_ar ?? '—'}</p>
                    <p className="mt-1 text-xs text-text-muted">{new Date(req.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SY' : 'en-US')}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLOR[req.status] ?? 'bg-stone-100 text-stone-500'}`}>
                    {t(`status.${req.status}`, { fallback: STATUS_LABEL[req.status] ?? req.status })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}