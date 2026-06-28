'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCartStore } from '../../lib/cart/cartStore';
import { cartItemsToOrderPayload, getCartSubtotal } from '../../lib/cart/cartUtils';
import { formatSYP, GOVERNORATES } from '@eurostore/shared';

export default function CheckoutPage() {
  const t      = useTranslations();
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  const subtotal = getCartSubtotal(items);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true); setError('');
    const d = Object.fromEntries(new FormData(e.currentTarget));

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address_snapshot: {
          full_name:   d.full_name,
          phone:       d.phone,
          governorate: d.governorate,
          address:     d.address,
          notes:       (d.notes as string) || null,
        },
        items:         cartItemsToOrderPayload(items),
        subtotal_syp:  subtotal,
        shipping_syp:  0,
        total_syp:     subtotal,
        notes:         (d.notes as string) || null,
      }),
    });

    if (res.ok) {
      const { order_number } = (await res.json()) as { order_number: string };
      clearCart();
      router.push(`/orders/${order_number}`);
    } else {
      setError(t('checkout.orderFailed'));
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#0F0F0F] px-6 py-10 text-[#E2E2E2]">
        <div className="mx-auto max-w-3xl text-center py-20">
          <p className="text-[#9CA3AF] mb-4">{t('cart.empty')}</p>
          <Link href="/products" className="text-[#C9A84C] hover:underline">{t('cart.continueShopping')}</Link>
        </div>
      </main>
    );
  }

  const inputCls = "rounded border border-[#2E2E2E] bg-[#151515] px-3 py-2.5 text-[#E2E2E2] outline-none focus:border-[#C9A84C] w-full text-sm";

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-6 py-10 text-[#E2E2E2]">
      <div className="mx-auto max-w-4xl">
        <nav className="flex items-center justify-between border-b border-[#2E2E2E] pb-5 mb-10">
          <Link href="/" className="text-xl font-semibold text-[#C9A84C]">{t('common.appName')}</Link>
          <Link href="/cart" className="text-sm text-[#D6D3C7]">{t('cart.title')}</Link>
        </nav>

        <h1 className="text-3xl font-semibold mb-8">{t('checkout.title')}</h1>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <p className="rounded border border-red-800 bg-red-900/20 p-4 text-sm text-red-400">{error}</p>
            )}

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[#9CA3AF]">{t('checkout.fullName')} *</span>
              <input name="full_name" required minLength={2} className={inputCls} />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[#9CA3AF]">{t('checkout.phone')} *</span>
              <input name="phone" required type="tel" minLength={7} className={inputCls} placeholder="09xxxxxxxx" dir="ltr" />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[#9CA3AF]">{t('checkout.governorate')} *</span>
              <select name="governorate" required className={inputCls}>
                <option value="">{t('checkout.selectGov')}</option>
                {GOVERNORATES.map(g => (
                  <option key={g.id} value={g.id}>{g.ar}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[#9CA3AF]">{t('checkout.address')} *</span>
              <textarea name="address" required minLength={5} rows={3}
                className={`${inputCls} resize-y`} />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[#9CA3AF]">{t('checkout.notes')} <span className="text-[#6B7280]">({t('checkout.notesHint')})</span></span>
              <textarea name="notes" rows={2} className={`${inputCls} resize-y`} />
            </label>

            <button type="submit" disabled={submitting}
              className="rounded-sm bg-[#C9A84C] py-3 text-sm font-semibold text-[#111] hover:bg-[#D8B95F] transition-colors disabled:opacity-50">
              {submitting ? t('common.loading') : t('checkout.confirmOrder')}
            </button>
          </form>

          {/* Order summary */}
          <div className="rounded-md border border-[#2E2E2E] bg-[#151515] p-6 h-fit">
            <h2 className="text-lg font-semibold mb-4">{t('cart.orderSummary')}</h2>
            <div className="flex flex-col gap-2 text-sm">
              {items.map(i => (
                <div key={i.variantId} className="flex justify-between text-[#9CA3AF]">
                  <span className="truncate me-2">{i.nameAr} × {i.quantity}</span>
                  <span className="shrink-0">{formatSYP(i.priceSyp * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between font-semibold text-lg border-t border-[#2E2E2E] pt-4 mt-4">
              <span>{t('cart.total')}</span>
              <span className="text-[#C9A84C]">{formatSYP(subtotal)}</span>
            </div>
            <p className="mt-4 text-xs text-[#6B7280]">{t('cart.confirmNote')}</p>
          </div>
        </div>
      </div>
    </main>
  );
}