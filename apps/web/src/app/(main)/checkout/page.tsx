/* eslint-disable */
// @ts-nocheck
'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCartStore } from '../../lib/cart/cartStore';
import { cartItemsToOrderPayload, getCartSubtotal } from '../../lib/cart/cartUtils';
import { formatSYP, GOVERNORATES } from '@eurostore/shared';

/* ── Types ─────────────────────────────────────────────── */
interface DiscountResult {
  discount_id:     string;
  discount_amount: number;
  type:            string;
  value:           number;
}

interface ShippingResult {
  base_rate_syp:              number;
  free_shipping_threshold_syp: number | null;
}

/* ── Component ─────────────────────────────────────────── */
export default function CheckoutPage() {
  const t      = useTranslations();
  const router = useRouter();
  const { items, clearCart } = useCartStore();

  /* form state */
  const [submitting, setSubmitting]   = useState(false);
  const [formError,  setFormError]    = useState('');

  /* shipping */
  const [governorate,   setGovernorate]   = useState('');
  const [shippingRate,  setShippingRate]  = useState<ShippingResult | null>(null);
  const [loadingShip,   setLoadingShip]   = useState(false);

  /* discount code */
  const [codeInput,     setCodeInput]     = useState('');
  const [applyingCode,  setApplyingCode]  = useState(false);
  const [codeError,     setCodeError]     = useState('');
  const [discount,      setDiscount]      = useState<DiscountResult | null>(null);

  /* loyalty (guest users: points = 0) */
  const [loyaltyPoints,      setLoyaltyPoints]      = useState(0);
  const [usePoints,          setUsePoints]           = useState(false);
  const [loadingPoints,      setLoadingPoints]       = useState(false);

  const subtotal = getCartSubtotal(items);

  /* ── Fetch shipping when governorate changes ─────────── */
  useEffect(() => {
    if (!governorate) { setShippingRate(null); return; }
    setLoadingShip(true);
    fetch(`/api/checkout/shipping?gov=${encodeURIComponent(governorate)}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: ShippingResult | null) => { setShippingRate(d); setLoadingShip(false); })
      .catch(() => setLoadingShip(false));
  }, [governorate]);

  /* ── Fetch loyalty points for logged-in user ─────────── */
  useEffect(() => {
    setLoadingPoints(true);
    fetch('/api/loyalty/balance')
      .then(r => r.ok ? r.json() : { points: 0 })
      .then((d: { points: number }) => setLoyaltyPoints(d.points ?? 0))
      .catch(() => setLoyaltyPoints(0))
      .finally(() => setLoadingPoints(false));
  }, []);

  /* ── Computed values ─────────────────────────────────── */
  const shippingSyp: number = (() => {
    if (!shippingRate) return 0;
    if (shippingRate.free_shipping_threshold_syp &&
        subtotal >= shippingRate.free_shipping_threshold_syp) return 0;
    return shippingRate.base_rate_syp;
  })();

  const discountSyp = discount?.discount_amount ?? 0;

  // loyalty: max 30% of subtotal, point value = 10 SYP each
  const POINT_VALUE_SYP = 10;
  const MAX_LOYALTY_PCT = 0.30;
  const loyaltyDiscountSyp: number = (() => {
    if (!usePoints || loyaltyPoints === 0) return 0;
    const maxByPct = Math.floor(subtotal * MAX_LOYALTY_PCT);
    const maxByPts = loyaltyPoints * POINT_VALUE_SYP;
    return Math.min(maxByPct, maxByPts);
  })();
  const loyaltyPointsUsed: number = usePoints
    ? Math.ceil(loyaltyDiscountSyp / POINT_VALUE_SYP)
    : 0;

  const totalSyp = Math.max(0, subtotal - discountSyp - loyaltyDiscountSyp + shippingSyp);

  /* ── Apply discount code ─────────────────────────────── */
  const applyCode = useCallback(async () => {
    if (!codeInput.trim()) return;
    setApplyingCode(true);
    setCodeError('');
    try {
      const res = await fetch('/api/checkout/validate-discount', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code: codeInput.trim(), subtotal_syp: subtotal }),
      });
      const data = await res.json() as { error?: string; discount_id?: string; discount_amount?: number; type?: string; value?: number; min?: number };
      if (!res.ok) {
        const errMap: Record<string, string> = {
          invalid_code:      t('checkout.invalidCode'),
          code_expired:      t('checkout.codeExpired'),
          code_maxed:        t('checkout.codeMaxed'),
          code_inactive:     t('checkout.codeInactive'),
          min_order_not_met: t('checkout.minOrderNotMet'),
        };
        setCodeError(errMap[data.error ?? ''] ?? t('checkout.invalidCode'));
        setDiscount(null);
      } else {
        setDiscount({
          discount_id:     data.discount_id ?? '',
          discount_amount: data.discount_amount ?? 0,
          type:            data.type ?? '',
          value:           data.value ?? 0,
        });
        setCodeError('');
      }
    } catch {
      setCodeError(t('checkout.invalidCode'));
    } finally {
      setApplyingCode(false);
    }
  }, [codeInput, subtotal, t]);

  /* ── Submit order ────────────────────────────────────── */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    const d = Object.fromEntries(new FormData(e.currentTarget));

    const res = await fetch('/api/orders', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address_snapshot: {
          full_name:   d.full_name,
          phone:       d.phone,
          governorate: d.governorate,
          address:     d.address,
          notes:       (d.notes as string) || null,
        },
        items:                cartItemsToOrderPayload(items),
        subtotal_syp:         subtotal,
        discount_syp:         discountSyp,
        discount_id:          discount?.discount_id ?? null,
        loyalty_points_used:  loyaltyPointsUsed,
        loyalty_discount_syp: loyaltyDiscountSyp,
        notes:                (d.notes as string) || null,
      }),
    });

    if (res.ok) {
      const { order_number } = (await res.json()) as { order_number: string };
      clearCart();
      router.push(`/orders/${order_number}`);
    } else {
      setFormError(t('checkout.orderFailed'));
      setSubmitting(false);
    }
  }

  /* ── Empty cart ──────────────────────────────────────── */
  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#0F0F0F] px-6 py-10 text-[#E2E2E2]">
        <div className="mx-auto max-w-3xl text-center py-20">
          <p className="text-[#9CA3AF] mb-4">{t('cart.empty')}</p>
          <Link href="/products" className="text-[#C9A84C] hover:underline">
            {t('cart.continueShopping')}
          </Link>
        </div>
      </main>
    );
  }

  const inp = "rounded border border-[#2E2E2E] bg-[#151515] px-3 py-2.5 text-[#E2E2E2] outline-none focus:border-[#C9A84C] w-full text-sm";

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-6 py-10 text-[#E2E2E2]">
      <div className="mx-auto max-w-4xl">
        {/* Nav */}
        <nav className="flex items-center justify-between border-b border-[#2E2E2E] pb-5 mb-10">
          <Link href="/" className="text-xl font-semibold text-[#C9A84C]">{t('common.appName')}</Link>
          <Link href="/cart" className="text-sm text-[#D6D3C7]">{t('cart.title')}</Link>
        </nav>

        <h1 className="text-3xl font-semibold mb-8">{t('checkout.title')}</h1>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">

          {/* ── Left: Form ────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {formError && (
              <p className="rounded border border-red-800 bg-red-900/20 p-4 text-sm text-red-400">
                {formError}
              </p>
            )}

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[#9CA3AF]">{t('checkout.fullName')} *</span>
              <input name="full_name" required minLength={2} className={inp} />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[#9CA3AF]">{t('checkout.phone')} *</span>
              <input name="phone" required type="tel" minLength={7}
                className={inp} placeholder="09xxxxxxxx" dir="ltr" />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[#9CA3AF]">{t('checkout.governorate')} *</span>
              <select
                name="governorate"
                required
                className={inp}
                value={governorate}
                onChange={e => setGovernorate(e.target.value)}
              >
                <option value="">{t('checkout.selectGov')}</option>
                {GOVERNORATES.map(g => (
                  <option key={g.id} value={g.id}>{g.ar}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[#9CA3AF]">{t('checkout.address')} *</span>
              <textarea name="address" required minLength={5} rows={3}
                className={`${inp} resize-y`} />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[#9CA3AF]">
                {t('checkout.notes')}{' '}
                <span className="text-[#6B7280]">({t('checkout.notesHint')})</span>
              </span>
              <textarea name="notes" rows={2} className={`${inp} resize-y`} />
            </label>

            {/* ── Discount Code ────────────────────────── */}
            <div className="flex flex-col gap-2">
              <span className="text-sm text-[#9CA3AF]">{t('checkout.discountCode')}</span>
              {discount ? (
                <div className="flex items-center justify-between rounded border border-green-800 bg-green-900/10 px-4 py-2.5">
                  <span className="text-sm text-green-400">
                    {t('checkout.codeApplied')} — {discount.type === 'percentage' ? `${discount.value}%` : formatSYP(discount.discount_amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setDiscount(null); setCodeInput(''); setCodeError(''); }}
                    className="text-xs text-red-400 hover:text-red-300 ms-4"
                  >
                    {t('checkout.removeCode')}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={codeInput}
                    onChange={e => setCodeInput(e.target.value.toUpperCase())}
                    placeholder="EURO2026"
                    className={`${inp} flex-1`}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => void applyCode()}
                    disabled={applyingCode || !codeInput.trim()}
                    className="rounded border border-[#C9A84C] px-4 py-2 text-sm text-[#C9A84C] hover:bg-[#C9A84C]/10 disabled:opacity-40"
                  >
                    {applyingCode ? '...' : t('checkout.applyCode')}
                  </button>
                </div>
              )}
              {codeError && (
                <p className="text-xs text-red-400">{codeError}</p>
              )}
            </div>

            {/* ── Loyalty Points ───────────────────────── */}
            {!loadingPoints && loyaltyPoints > 0 && (
              <div className="rounded border border-[#2E2E2E] bg-[#151515] p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usePoints}
                    onChange={e => setUsePoints(e.target.checked)}
                    className="mt-0.5 accent-[#C9A84C]"
                  />
                  <div className="flex flex-col gap-0.5 text-sm">
                    <span className="text-[#E2E2E2]">{t('checkout.usePoints')}</span>
                    <span className="text-[#9CA3AF]">
                      {t('checkout.yourPoints')} {loyaltyPoints.toLocaleString()}
                      {' · '}
                      {t('checkout.pointsWorth')}{' '}
                      {formatSYP(loyaltyPoints * POINT_VALUE_SYP)}
                    </span>
                    {usePoints && loyaltyDiscountSyp > 0 && (
                      <span className="text-green-400 text-xs">
                        − {formatSYP(loyaltyDiscountSyp)} ({loyaltyPointsUsed} {'\u0646\u0642\u0637\u0629'})
                      </span>
                    )}
                  </div>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-sm bg-[#C9A84C] py-3 text-sm font-semibold text-[#111] hover:bg-[#D8B95F] transition-colors disabled:opacity-50"
            >
              {submitting ? t('common.loading') : t('checkout.confirmOrder')}
            </button>
          </form>

          {/* ── Right: Order Summary ───────────────────── */}
          <div className="rounded-md border border-[#2E2E2E] bg-[#151515] p-6 h-fit sticky top-6">
            <h2 className="text-lg font-semibold mb-4">{t('cart.orderSummary')}</h2>

            {/* Items */}
            <div className="flex flex-col gap-2 text-sm mb-4">
              {items.map(i => (
                <div key={i.variantId} className="flex justify-between text-[#9CA3AF]">
                  <span className="truncate me-2">{i.nameAr} × {i.quantity}</span>
                  <span className="shrink-0">{formatSYP(i.priceSyp * i.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="flex flex-col gap-2 text-sm border-t border-[#2E2E2E] pt-4">
              <div className="flex justify-between text-[#9CA3AF]">
                <span>{t('checkout.subtotal')}</span>
                <span>{formatSYP(subtotal)}</span>
              </div>

              {/* Shipping */}
              <div className="flex justify-between text-[#9CA3AF]">
                <span>{t('checkout.shipping')}</span>
                <span>
                  {!governorate
                    ? '—'
                    : loadingShip
                    ? '...'
                    : shippingSyp === 0
                    ? <span className="text-green-400">{t('checkout.freeShipping')}</span>
                    : formatSYP(shippingSyp)
                  }
                </span>
              </div>

              {/* Discount code */}
              {discountSyp > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>{t('checkout.discount')}</span>
                  <span>− {formatSYP(discountSyp)}</span>
                </div>
              )}

              {/* Loyalty */}
              {loyaltyDiscountSyp > 0 && (
                <div className="flex justify-between text-[#C9A84C]">
                  <span>{t('checkout.loyaltyDiscount')}</span>
                  <span>− {formatSYP(loyaltyDiscountSyp)}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between font-semibold text-lg border-t border-[#2E2E2E] pt-4 mt-4">
              <span>{t('cart.total')}</span>
              <span className="text-[#C9A84C]">{formatSYP(totalSyp)}</span>
            </div>

            <p className="mt-4 text-xs text-[#6B7280]">{t('cart.confirmNote')}</p>
          </div>
        </div>
      </div>
    </main>
  );
}