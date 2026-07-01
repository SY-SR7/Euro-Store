// @ts-nocheck
/* eslint-disable */
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { getSessionClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  pending:'معلق', confirmed:'مؤكد', processing:'قيد التجهيز',
  shipped:'تم الشحن', delivered:'تم التسليم', completed:'مكتمل', cancelled:'ملغي',
};
const STATUS_COLOR: Record<string, string> = {
  pending:'bg-amber-50 text-amber-700', confirmed:'bg-blue-50 text-blue-700',
  processing:'bg-purple-50 text-purple-700', shipped:'bg-indigo-50 text-indigo-700',
  delivered:'bg-green-50 text-green-700', completed:'bg-green-50 text-green-700', cancelled:'bg-red-50 text-red-700',
};

export default async function CustomerOrdersPage() {
  const t = await getTranslations('orders');
  const locale = await getLocale();
  const isAr = locale === 'ar';
  const { client: supabase, user } = await getSessionClient();
  if (!user) redirect('/auth/login');

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, total_syp, created_at')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen bg-[#FAFAF8] px-4 py-10" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <Link href="/" className="text-sm text-[#B8860B] hover:underline">{t('home')}</Link>
          <h1 className="mt-3 text-2xl font-black text-[#1C1917]">{t('title')}</h1>
        </div>

        {(!orders || orders.length === 0) ? (
          <div className="rounded-2xl border border-[#E7E3DC] bg-white p-10 text-center shadow-sm">
            <p className="text-[#A8A29E]">{t('noOrders')}</p>
            <Link href="/products" className="mt-4 inline-block rounded-xl bg-[#B8860B] px-5 py-2.5 text-sm font-bold text-[#1F1B16] hover:bg-[#9A7209] transition-colors">
              {t('browseProducts')}
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E7E3DC] bg-white shadow-sm">
            <div className="divide-y divide-[#F0ECE6]">
              {orders.map((o: any) => (
                <Link key={o.id} href={`/orders/${o.order_number}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-[#FAFAF8] transition-colors">
                  <div>
                    <p className="font-mono text-sm font-bold text-[#1C1917]">#{o.order_number}</p>
                    <p className="mt-0.5 text-xs text-[#A8A29E]">{new Date(o.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SY' : 'en-US')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-[#57534E]">{Number(o.total_syp).toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US')} {t('syp')}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLOR[o.status] ?? 'bg-stone-100 text-stone-500'}`}>
                      {t(`status.${o.status}`, { fallback: STATUS_LABEL[o.status] ?? o.status })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
