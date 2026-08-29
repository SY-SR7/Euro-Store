'use client';
/* eslint-disable */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { useLocale, useTranslations } from 'next-intl';
import { AuthModalButton } from '@/components/auth/AuthAwareLink';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export default function NewExchangePage() {
  const [orders, setOrders]       = useState<any[]>([]);
  const [orderId, setOrderId]     = useState('');
  const [orderItemId, setOrderItemId] = useState('');
  const [reason, setReason]       = useState('');
  const [whatsapp, setWhatsapp]   = useState('');
  const [images, setImages]       = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [user, setUser]           = useState<any>(null);
  const locale = useLocale();
  const t = useTranslations('exchange');
  const isAr = locale === 'ar';

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    (async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
      if (!u) { setLoadingOrders(false); return; }
      const { data } = await supabase
        .from('orders')
        .select('id,order_number,status,total_syp,created_at,order_items(id,quantity,product_snapshot)')
        .eq('customer_id', u.id)
        .in('status', ['delivered','completed'])
        .order('created_at', { ascending: false });
      setOrders(data ?? []);
      setLoadingOrders(false);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderId) { setError(t('errors.selectOrderFirst')); return; }
    if (!orderItemId) { setError(isAr ? 'يرجى اختيار المنتج المطلوب استبداله' : 'Please choose the item to exchange'); return; }
    if (!reason.trim()) { setError(t('errors.writeReason')); return; }
    if (!whatsapp.trim()) { setError(isAr ? 'يرجى إدخال رقم الواتساب' : 'Please enter your WhatsApp number'); return; }
    if (!images || images.length < 1 || images.length > 3) { setError(isAr ? 'يرجى إرفاق صورة واحدة إلى ثلاث صور' : 'Please attach 1 to 3 images'); return; }
    if (Array.from(images).some((file) => !ALLOWED_IMAGE_TYPES.includes(file.type))) {
      setError(isAr ? 'يرجى إرفاق صور بصيغة JPG أو PNG أو WebP أو AVIF فقط' : 'Please attach JPG, PNG, WebP, or AVIF images only');
      return;
    }
    if (Array.from(images).some((file) => file.size > MAX_IMAGE_SIZE)) {
      setError(isAr ? 'حجم كل صورة يجب ألا يتجاوز 5 ميغابايت' : 'Each image must be 5 MB or smaller');
      return;
    }

    setError(''); setSuccess(''); setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set('order_item_id', orderItemId);
      formData.set('reason', reason);
      formData.set('customer_whatsapp', whatsapp);
      Array.from(images).forEach((file) => formData.append('images', file));

      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/exchange`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? t('errors.generic')); }
      else {
        setSuccess(`${t('successMsg')} ${data.exchange_request?.id ?? ''}`);
        setOrderId(''); setOrderItemId(''); setReason(''); setWhatsapp(''); setImages(null);
      }
    } catch { setError(t('errors.network')); }
    finally { setSubmitting(false); }
  }

  const selectedOrder = orders.find((order: any) => order.id === orderId);
  const selectedOrderItems = selectedOrder?.order_items ?? [];

  function itemLabel(item: any) {
    const snapshot = item?.product_snapshot ?? {};
    const name =
      snapshot.name_ar ||
      snapshot.name_en ||
      snapshot.product_name_ar ||
      snapshot.product_name_en ||
      snapshot.name ||
      (isAr ? 'منتج من الطلب' : 'Order item');
    const sku = snapshot.sku ? ` - ${snapshot.sku}` : '';
    return `${name}${sku} × ${item.quantity ?? 1}`;
  }

  if (!user && !loadingOrders) {
    return (
      <main className="min-h-screen bg-background px-6 py-12" dir={isAr ? "rtl" : "ltr"}>
        <div className="mx-auto max-w-lg text-center space-y-4">
          <p className="text-lg font-bold text-[#1F1B16]">{t('loginRequired')}</p>
          <AuthModalButton next="/exchange/new" className="inline-block rounded-xl bg-primary px-6 py-3 text-sm font-bold text-text-primary">{t('login')}</AuthModalButton>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-[#1F1B16]" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <Link href="/exchange" className="text-xs text-primary hover:underline">{isAr ? '←' : '→'} {t('title')}</Link>
          <h1 className="mt-3 text-2xl font-black text-[#1F1B16]">{t('newRequest')}</h1>
          <p className="mt-1 text-sm text-[#6F6658]">{t('policy')}</p>
        </div>

        {error   && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

        {loadingOrders ? (
          <div className="rounded-2xl border border-border bg-background-card p-8 text-center text-sm text-text-muted">{t('loadingOrders')}</div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-border bg-background-card p-8 text-center space-y-3">
            <p className="text-[#6F6658]">{t('noEligibleOrders')}</p>
            <p className="text-xs text-text-muted">{t('eligibilityNote', { fallback: 'يجب أن يكون الطلب في حالة "تم التسليم" حتى تتمكن من طلب الاستبدال' })}</p>
            <Link href="/products" className="inline-block rounded-xl bg-primary px-5 py-2 text-sm font-bold text-text-primary">{t('shopNow')}</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-background-card p-6 shadow-sm">
            <div>
              <label className="mb-2 block text-sm font-bold text-[#1F1B16]">{t('chooseOrder')}</label>
              <select aria-label={t('chooseOrder')} value={orderId} onChange={e => { setOrderId(e.target.value); setOrderItemId(''); }} required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-[#1F1B16] outline-none focus:border-primary">
                <option value="">— {t('selectOrder')} —</option>
                {orders.map((o: any) => (
                  <option key={o.id} value={o.id}>
                    #{o.order_number} — {Number(o.total_syp).toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US')} {t('syp')} — {new Date(o.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SY' : 'en-US')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[#1F1B16]">{isAr ? 'المنتج المطلوب استبداله' : 'Item to Exchange'}</label>
              <select aria-label={isAr ? 'المنتج المطلوب استبداله' : 'Item to exchange'} value={orderItemId} onChange={e => setOrderItemId(e.target.value)} required disabled={!orderId}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-[#1F1B16] outline-none focus:border-primary disabled:opacity-50">
                <option value="">— {isAr ? 'اختر المنتج' : 'Select item'} —</option>
                {selectedOrderItems.map((item: any) => (
                  <option key={item.id} value={item.id}>{itemLabel(item)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[#1F1B16]">{isAr ? 'رقم الواتساب للتواصل' : 'WhatsApp Number'}</label>
              <input type="text" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required
                placeholder="+963..."
                dir="ltr"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-[#1F1B16] outline-none focus:border-primary placeholder:text-text-muted" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[#1F1B16]">{isAr ? 'صور المنتج (1-3)' : 'Product Images (1-3)'}</label>
              <input aria-label={isAr ? 'صور المنتج' : 'Product images'} type="file" multiple accept="image/*" required onChange={e => setImages(e.target.files)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-[#1F1B16] outline-none focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-text-primary hover:file:bg-primary/90" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[#1F1B16]">{t('exchangeReason')}</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} required rows={4}
                placeholder={t('reasonPlaceholder')}
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-[#1F1B16] outline-none focus:border-primary placeholder:text-text-muted" />
            </div>

            <button type="submit" disabled={submitting || !orderId || !orderItemId}
              className="w-full rounded-xl bg-primary py-3 text-sm font-black text-[#1F1B16] hover:bg-[#9A7209] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? t('sending') : t('sendExchangeRequest')}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
