'use client';
/* eslint-disable */
// @ts-nocheck
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/supabase-server';
import { formatSYP } from '@eurostore/shared';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  pending:    'statusPending',
  confirmed:  'statusConfirmed',
  processing: 'statusProcessing',
  shipped:    'statusShipped',
  delivered:  'statusDelivered',
  cancelled:  'statusCancelled',
};
const STATUS_COLOR: Record<string, string> = {
  pending:    'bg-yellow-900/30 text-yellow-400',
  confirmed:  'bg-blue-900/30 text-blue-400',
  processing: 'bg-purple-900/30 text-purple-400',
  shipped:    'bg-indigo-900/30 text-indigo-400',
  delivered:  'bg-green-900/30 text-green-400',
  cancelled:  'bg-red-900/30 text-red-400',
};

export default async function CustomerOrdersPage(): Promise<JSX.Element> {
  const t = await getTranslations();
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, total_syp, created_at')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen bg-[#0F0F0F] text-[#E2E2E2] px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <nav className="mb-8">
          <Link href="/" className="text-[#C9A84C] text-sm hover:underline">
            ← {t('common.appName')}
          </Link>
        </nav>

        <h1 className="text-2xl font-semibold mb-8">{t('orders.title')}</h1>

        {(!orders || orders.length === 0) ? (
          <div className="rounded-md border border-[#2E2E2E] bg-[#151515] p-12 text-center">
            <p className="text-[#9CA3AF] mb-6">{t('orders.empty')}</p>
            <Link
              href="/products"
              className="inline-block rounded-sm bg-[#C9A84C] px-6 py-2.5 text-sm font-semibold text-[#111] hover:bg-[#D8B95F] transition-colors"
            >
              {t('nav.shop')}
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-[#2E2E2E]">
            <table className="w-full text-sm">
              <thead className="bg-[#161616] text-[#9CA3AF]">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t('orders.orderNumber')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('orders.date')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('orders.total')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('orders.status')}</th>
                  <th className="px-4 py-3 text-start font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2E2E]">
                {(orders ?? []).map((order: any) => (
                  <tr key={order.id} className="hover:bg-[#161616] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[#C9A84C]">{order.order_number}</td>
                    <td className="px-4 py-3 text-[#9CA3AF] text-xs">
                      {new Date(order.created_at as string).toLocaleDateString('ar-SY')}
                    </td>
                    <td className="px-4 py-3 text-[#E2E2E2] font-semibold">{formatSYP(order.total_syp)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-sm px-2 py-1 text-xs font-medium ${STATUS_COLOR[order.status] ?? 'text-[#9CA3AF]'}`}>
                        {t(`orders.${STATUS_LABEL[order.status] ?? 'status'}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/orders/${order.order_number}`}
                        className="text-xs text-[#C9A84C] hover:underline"
                      >
                        {t('orders.viewDetails')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
