// @ts-nocheck
/* eslint-disable */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/supabase-server';
import { formatSYP } from '@eurostore/shared';

export const dynamic = 'force-dynamic';

interface Props { params: { orderNumber: string } }

interface OrderItem {
  id: string;
  quantity: number;
  unit_price_syp: number;
  total_price_syp: number;
  product_snapshot: { name_ar: string; sku: string };
}

export default async function OrderConfirmationPage({ params }: Props) {
  const t = await getTranslations();
  const supabase = createServerSupabaseClient();

  const { data: order } = await supabase
    .from('orders')
    .select('order_number, total_syp, status, address_snapshot, created_at, order_items(id, quantity, unit_price_syp, total_price_syp, product_snapshot)')
    .eq('order_number', params.orderNumber)
    .single();

  if (!order) notFound();

  const snapshot = order.address_snapshot as { full_name: string; phone: string; governorate: string; address: string };
  const items    = (order.order_items ?? []) as OrderItem[];

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-6 py-10 text-[#E2E2E2]">
      <div className="mx-auto max-w-2xl">
        <nav className="flex items-center justify-between border-b border-[#2E2E2E] pb-5 mb-10">
          <Link href="/" className="text-xl font-semibold text-[#C9A84C]">{t('common.appName')}</Link>
        </nav>

        {/* Success header */}
        <div className="mb-8 rounded-md border border-green-800 bg-green-900/10 p-6 text-center">
          <div className="mb-3 text-4xl">✓</div>
          <h1 className="text-2xl font-semibold text-green-400">{t('checkout.successTitle')}</h1>
          <p className="mt-3 text-[#9CA3AF]">
            {t('checkout.successMsg')}
            <span className="ms-2 font-mono font-semibold text-[#C9A84C]">{order.order_number}</span>
          </p>
          <p className="mt-2 text-sm text-[#6B7280]">{t('cart.confirmNote')}</p>
        </div>

        {/* Order details */}
        <div className="flex flex-col gap-6">
          <div className="rounded-md border border-[#2E2E2E] bg-[#151515] p-5">
            <h2 className="mb-4 font-semibold">معلومات التوصيل</h2>
            <div className="grid grid-cols-2 gap-3 text-sm text-[#9CA3AF]">
              <div><span className="text-[#6B7280]">الاسم:</span> {snapshot.full_name}</div>
              <div><span className="text-[#6B7280]">الهاتف:</span> {snapshot.phone}</div>
              <div><span className="text-[#6B7280]">المحافظة:</span> {snapshot.governorate}</div>
              <div className="col-span-2"><span className="text-[#6B7280]">العنوان:</span> {snapshot.address}</div>
            </div>
          </div>

          <div className="rounded-md border border-[#2E2E2E] bg-[#151515] p-5">
            <h2 className="mb-4 font-semibold">المنتجات</h2>
            <div className="flex flex-col gap-3">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div>
                    <p className="text-[#E2E2E2]">{item.product_snapshot.name_ar}</p>
                    <p className="text-xs font-mono text-[#6B7280]">{item.product_snapshot.sku} × {item.quantity}</p>
                  </div>
                  <p className="text-[#C9A84C]">{formatSYP(item.total_price_syp)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-[#2E2E2E] pt-4 font-semibold">
              <span>{t('cart.total')}</span>
              <span className="text-[#C9A84C]">{formatSYP(order.total_syp)}</span>
            </div>
          </div>

          <Link href="/"
            className="block w-full rounded-sm border border-[#2E2E2E] py-3 text-center text-sm text-[#9CA3AF] hover:border-[#C9A84C] hover:text-[#E2E2E2] transition-colors">
            {t('checkout.backHome')}
          </Link>
        </div>
      </div>
    </main>
  );
}