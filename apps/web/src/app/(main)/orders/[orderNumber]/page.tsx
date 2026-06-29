// @ts-nocheck
/* eslint-disable */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  pending: 'قيد الانتظار', confirmed: 'مؤكد', processing: 'قيد التجهيز',
  shipped: 'تم الشحن', delivered: 'تم التسليم', cancelled: 'ملغي',
};
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-purple-50 text-purple-700 border-purple-200',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

function fmt(n: number) { return Number(n || 0).toLocaleString('ar-SY') + ' ل.س'; }

interface Props { params: { orderNumber: string } }

export default async function OrderDetailPage({ params }: Props) {
  const supabase = createServerSupabaseClient();

  const { data: order } = await supabase
    .from('orders')
    .select('order_number, total_syp, status, address_snapshot, created_at, order_items(id, quantity, unit_price_syp, total_price_syp, product_snapshot)')
    .eq('order_number', params.orderNumber)
    .single();

  if (!order) notFound();

  const snapshot = order.address_snapshot as any;
  const items    = (order.order_items ?? []) as any[];

  return (
    <main className="min-h-screen bg-[#FAFAF8] px-4 py-10" dir="rtl">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Success banner */}
        <div className="rounded-3xl border border-green-200 bg-green-50 p-8 text-center shadow-sm">
          <div className="mb-4 text-5xl">✅</div>
          <h1 className="text-2xl font-black text-green-800">تم تأكيد طلبك!</h1>
          <p className="mt-2 text-sm text-green-700">
            رقم طلبك: <span className="font-mono font-black text-lg text-[#B8860B]">#{order.order_number}</span>
          </p>
          <p className="mt-2 text-xs text-green-600">سيتم التواصل معك هاتفياً لتأكيد الطلب والتحقق من العنوان</p>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between rounded-2xl border border-[#E5E0D8] bg-white px-5 py-4 shadow-sm">
          <span className="text-sm font-bold text-[#57534E]">حالة الطلب</span>
          <span className={`rounded-full border px-4 py-1 text-xs font-bold ${STATUS_COLOR[order.status] ?? 'bg-stone-100 text-stone-500 border-stone-200'}`}>
            {STATUS_LABEL[order.status] ?? order.status}
          </span>
        </div>

        {/* Delivery info */}
        {snapshot && (
          <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm space-y-3">
            <h2 className="font-black text-[#1C1917]">معلومات التوصيل</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['الاسم', snapshot.full_name],
                ['الهاتف', snapshot.phone],
                ['المحافظة', snapshot.governorate],
              ].map(([k, v]) => v && (
                <div key={k}>
                  <span className="text-xs text-[#A8A29E]">{k}</span>
                  <p className="font-semibold text-[#1C1917]">{v}</p>
                </div>
              ))}
              {snapshot.address && (
                <div className="col-span-2">
                  <span className="text-xs text-[#A8A29E]">العنوان</span>
                  <p className="font-semibold text-[#1C1917]">{snapshot.address}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm space-y-3">
          <h2 className="font-black text-[#1C1917]">المنتجات ({items.length})</h2>
          <div className="space-y-3">
            {items.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center text-sm border-b border-[#F0ECE6] pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-semibold text-[#1C1917]">{item.product_snapshot?.name_ar ?? '—'}</p>
                  <p className="text-xs text-[#A8A29E] font-mono">{item.product_snapshot?.sku} × {item.quantity}</p>
                </div>
                <p className="font-bold text-[#B8860B]">{fmt(item.total_price_syp)}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t border-[#E5E0D8] pt-4 text-base font-black text-[#1C1917]">
            <span>الإجمالي</span>
            <span className="text-[#B8860B]">{fmt(order.total_syp)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/orders"
            className="flex-1 rounded-2xl border border-[#E5E0D8] py-3 text-center text-sm font-bold text-[#57534E] hover:border-[#B8860B] hover:text-[#B8860B] transition-colors">
            طلباتي
          </Link>
          <Link href="/products"
            className="flex-1 rounded-2xl bg-[#B8860B] py-3 text-center text-sm font-bold text-white hover:bg-[#9A7209] transition-colors">
            متابعة التسوق
          </Link>
        </div>
      </div>
    </main>
  );
}