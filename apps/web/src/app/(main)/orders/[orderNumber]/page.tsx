// @ts-nocheck
/* eslint-disable */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { createAdminSupabaseClient } from '@/supabase-server';
import { getSessionClient } from '@/supabase-server';
import { WriteReviewForm } from '@/components/product/WriteReviewForm';
import { DroneDelivery } from '@/components/orders/DroneDelivery';
import { TimeTravelDelivery } from '@/components/orders/TimeTravelDelivery';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  pending: 'قيد الانتظار', confirmed: 'مؤكد', processing: 'قيد التجهيز',
  shipped: 'تم الشحن', delivered: 'تم التسليم', completed: 'مكتمل', cancelled: 'ملغي',
};
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-purple-50 text-purple-700 border-purple-200',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

function fmt(n: number, locale: string) { return Number(n || 0).toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US') + (locale === 'ar' ? ' ل.س' : ' SYP'); }

interface Props { params: { orderNumber: string } }

export default async function OrderDetailPage({ params }: Props) {
  // قراءة عامة (service-role) — صفحة تأكيد الطلب يجب أن تعمل للزوار أيضاً
  // (سياسات RLS الحالية على جدول orders لا تسمح بقراءة anon، لذلك نستخدم
  // service-role هنا تحديداً لهذه الصفحة العامة فقط).
  const locale = await getLocale();
  const t = await getTranslations('orders');
  const tCat = await getTranslations('catalog');
  const isAr = locale === 'ar';
  const admin = createAdminSupabaseClient();

  const { data: order } = await admin
    .from('orders')
    .select(`
      order_number, total_syp, status, address_snapshot, created_at, customer_id,
      order_items (
        id, quantity, unit_price_syp, total_price_syp, product_snapshot, variant_id,
        product_variants ( id, product_id, products ( id, slug ) )
      )
    `)
    .eq('order_number', params.orderNumber)
    .single();

  if (!order) notFound();

  // تحديد إن كان المستخدم الحالي هو صاحب الطلب (لإظهار زر "اكتب تقييم")
  const { user } = await getSessionClient();
  const isOwner = !!user && user.id === order.customer_id;

  // إن كانت حالة الطلب "مكتمل" والمستخدم هو صاحبه، نتحقق من التقييمات
  // الموجودة مسبقاً لكل منتج في هذا الطلب لإخفاء النموذج عن المنتجات
  // التي تم تقييمها بالفعل.
  let reviewedProductIds = new Set<string>();
  if (isOwner && order.status === 'completed') {
    const { data: existingReviews } = await admin
      .from('product_reviews')
      .select('product_id')
      .eq('order_id', order.order_number)
      .eq('customer_id', user.id);
    reviewedProductIds = new Set((existingReviews ?? []).map((r: any) => r.product_id));
  }

  const snapshot = order.address_snapshot as any;
  const items    = (order.order_items ?? []) as any[];

  return (
    <main className="min-h-screen bg-background px-4 py-10" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Success banner */}
        <div className="rounded-3xl border border-green-200 bg-green-50 p-8 text-center shadow-sm">
          <div className="mb-4 text-5xl">✅</div>
          <h1 className="text-2xl font-black text-green-800">{t('confirmedTitle')}</h1>
          <p className="mt-2 text-sm text-green-700">
            {t('orderNumber')} <span className="font-mono font-black text-lg text-primary">#{order.order_number}</span>
          </p>
          <p className="mt-2 text-xs text-green-600">{t('contactConfirmMsg')}</p>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between rounded-2xl border border-[#E5E0D8] bg-background-card px-5 py-4 shadow-sm">
          <span className="text-sm font-bold text-text-secondary">{t('orderStatus')}</span>
          <span className={`rounded-full border px-4 py-1 text-xs font-bold ${STATUS_COLOR[order.status] ?? 'bg-stone-100 text-stone-500 border-stone-200'}`}>
            {t(`status.${order.status}`, { fallback: STATUS_LABEL[order.status] ?? order.status })}
          </span>
        </div>

        {/* Delivery info */}
        {snapshot && (
          <div className="rounded-2xl border border-[#E5E0D8] bg-background-card p-5 shadow-sm space-y-3">
            <h2 className="font-black text-text-primary">{t('deliveryInfo')}</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                [t('name'), snapshot.full_name],
                [t('phone'), snapshot.phone],
                [t('governorate'), snapshot.governorate],
              ].map(([k, v]) => v && (
                <div key={k}>
                  <span className="text-xs text-text-muted">{k}</span>
                  <p className="font-semibold text-text-primary">{v}</p>
                </div>
              ))}
              {snapshot.address && (
                <div className="col-span-2">
                  <span className="text-xs text-text-muted">{t('address')}</span>
                  <p className="font-semibold text-text-primary">{snapshot.address}</p>
                </div>
              )}
            </div>
            <DroneDelivery status={order.status} />
            <TimeTravelDelivery />
          </div>
        )}

        {/* Items */}
        <div className="rounded-2xl border border-[#E5E0D8] bg-background-card p-5 shadow-sm space-y-3">
          <h2 className="font-black text-text-primary">{t('productsNum', { count: items.length, fallback: `المنتجات (${items.length})` })}</h2>
          <div className="space-y-4">
            {items.map((item: any) => {
              const productId = item.product_variants?.product_id ?? null;
              const alreadyReviewed = productId ? reviewedProductIds.has(productId) : false;
              const canReview = isOwner && order.status === 'completed' && productId && !alreadyReviewed;

              return (
                <div key={item.id} className="border-b border-[#F0ECE6] pb-4 last:border-0 last:pb-0 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      {item.product_variants?.products?.slug ? (
                        <Link href={`/products/${item.product_variants.products.slug}`} className="font-semibold text-text-primary hover:text-primary transition-colors hover:underline">
                          {isAr ? (item.product_snapshot?.name_ar ?? '—') : (item.product_snapshot?.name_en || item.product_snapshot?.name_ar || '—')}
                        </Link>
                      ) : (
                        <p className="font-semibold text-text-primary">{isAr ? (item.product_snapshot?.name_ar ?? '—') : (item.product_snapshot?.name_en || item.product_snapshot?.name_ar || '—')}</p>
                      )}
                      <p className="text-xs text-text-muted font-mono">{item.product_snapshot?.sku} × {item.quantity}</p>
                    </div>
                    <p className="font-bold text-primary">{fmt(item.total_price_syp, locale)}</p>
                  </div>

                  {isOwner && order.status === 'completed' && productId && (
                    alreadyReviewed ? (
                      <p className="text-xs font-semibold text-green-700">✓ {tCat('reviewSubmitted')}</p>
                    ) : (
                      <WriteReviewForm
                        productId={productId}
                        orderNumber={order.order_number}
                        productNameAr={isAr ? (item.product_snapshot?.name_ar ?? '') : (item.product_snapshot?.name_en || item.product_snapshot?.name_ar || '')}
                      />
                    )
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between border-t border-[#E5E0D8] pt-4 text-base font-black text-text-primary">
            <span>{t('total')}</span>
            <span className="text-primary">{fmt(order.total_syp, locale)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/orders"
            className="flex-1 rounded-2xl border border-[#E5E0D8] py-3 text-center text-sm font-bold text-text-secondary hover:border-primary hover:text-primary transition-colors">
            {t('myOrders')}
          </Link>
          <Link href="/products"
            className="flex-1 rounded-2xl bg-primary py-3 text-center text-sm font-bold text-text-primary hover:bg-[#9A7209] transition-colors">
            {t('continueShopping')}
          </Link>
        </div>
      </div>
    </main>
  );
}
