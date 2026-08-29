'use client';
/* eslint-disable */
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/cart/cartStore';
import { createBrowserClient } from '@supabase/ssr';
import { useLocale, useTranslations } from 'next-intl';

const GOVS = [
  { id: 'damascus', ar: 'دمشق' }, { id: 'aleppo', ar: 'حلب' },
  { id: 'homs', ar: 'حمص' }, { id: 'hama', ar: 'حماة' },
  { id: 'latakia', ar: 'اللاذقية' }, { id: 'tartus', ar: 'طرطوس' },
  { id: 'idlib', ar: 'إدلب' }, { id: 'deir_ez_zor', ar: 'دير الزور' },
  { id: 'raqqa', ar: 'الرقة' }, { id: 'hasakah', ar: 'الحسكة' },
  { id: 'daraa', ar: 'درعا' },
  { id: 'quneitra', ar: 'القنيطرة' }, { id: 'suwayda', ar: 'السويداء' },
  { id: 'rural_damascus', ar: 'ريف دمشق' },
];

import { PriceDisplay } from '@/components/common/PriceDisplay';

function getSubtotal(items: any[]) {
  return items.reduce((s: number, i: any) => s + i.priceSyp * i.quantity, 0);
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const locale = useLocale();
  const t = useTranslations('checkout');
  const tCart = useTranslations('cart');
  const isAr = locale === 'ar';

  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState('');
  const idempotencyKey = useRef(crypto.randomUUID());

  // Shipping
  const [governorate,  setGovernorate]  = useState('');
  const [shippingRate, setShippingRate] = useState<any>(null);
  const [loadingShip,  setLoadingShip]  = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');

  // Discount
  const [codeInput,    setCodeInput]    = useState('');
  const [applyingCode, setApplyingCode] = useState(false);
  const [codeError,    setCodeError]    = useState('');
  const [discount,     setDiscount]     = useState<any>(null);

  // Loyalty
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [usePoints,     setUsePoints]     = useState(false);
  // Canonical keys from system_settings: loyalty_point_value_syp, loyalty_max_redemption_pct
  const [loyaltySettings, setLoyaltySettings] = useState({
    point_value_syp: 10,     // 1 point = 10 SYP
    max_redeem_pct: 30,      // max % of order payable by points
    min_redeem_pts: 100,     // minimum points to enable redemption
  });

  const subtotal = getSubtotal(items);

  // Fetch shipping
  useEffect(() => {
    if (!governorate) { setShippingRate(null); return; }
    setLoadingShip(true);
    fetch(`/api/checkout/shipping?gov=${encodeURIComponent(governorate)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setShippingRate(d); setLoadingShip(false); })
      .catch(() => setLoadingShip(false));
  }, [governorate]);

  // Fetch addresses and loyalty
  useEffect(() => {
    fetch('/api/addresses')
      .then(r => r.ok ? r.json() : [])
      .then((d: any) => {
        if (Array.isArray(d)) {
          setAddresses(d);
          const def = d.find(a => a.is_default);
          if (def) setSelectedAddressId(def.id);
        }
      })
      .catch(() => {});

    fetch('/api/loyalty/balance')
      .then(r => r.ok ? r.json() : { points: 0 })
      .then((d: any) => setLoyaltyPoints(d.points ?? 0))
      .catch(() => {});
    fetch('/api/loyalty/settings')
      .then(r => r.ok ? r.json() : null)
      .then((d: any) => {
        if (d) setLoyaltySettings({
          point_value_syp: d.loyalty_point_value_syp ?? 10,
          max_redeem_pct: d.loyalty_max_redemption_pct ?? 30,
          min_redeem_pts: d.loyalty_min_redemption_pts ?? 100,
        });
      })
      .catch(() => {});
  }, []);

  // Update form fields when address selected
  const [formState, setFormState] = useState({
    full_name: '', phone: '', address: ''
  });

  useEffect(() => {
    if (selectedAddressId && selectedAddressId !== 'new') {
      const addr = addresses.find(a => a.id === selectedAddressId);
      if (addr) {
        setFormState({
          full_name: addr.full_name || '',
          phone: addr.phone || '',
          address: addr.street || ''
        });
        setGovernorate(addr.governorate || '');
      }
    } else {
      setFormState({ full_name: '', phone: '', address: '' });
      setGovernorate('');
    }
  }, [selectedAddressId, addresses]);

  const shippingSyp: number = (() => {
    if (!shippingRate) return 0;
    if (shippingRate.free_shipping_threshold_syp && subtotal >= shippingRate.free_shipping_threshold_syp) return 0;
    return shippingRate.base_rate_syp ?? 0;
  })();

  const discountSyp = discount?.discount_amount ?? 0;
  // 1 point = point_value_syp SYP
  const POINT_VAL   = loyaltySettings.point_value_syp || 10;
  const MAX_PCT     = loyaltySettings.max_redeem_pct / 100;
  const MIN_PTS     = loyaltySettings.min_redeem_pts || 100;
  const loyaltyDiscountSyp = (() => {
    if (!usePoints || loyaltyPoints < MIN_PTS) return 0;
    const maxByPct = Math.floor(subtotal * MAX_PCT);
    const maxByPts = Math.floor(loyaltyPoints * POINT_VAL);
    return Math.min(maxByPct, maxByPts);
  })();
  const loyaltyPointsUsed = usePoints ? Math.ceil(loyaltyDiscountSyp / POINT_VAL) : 0;
  const totalSyp = Math.max(0, subtotal - discountSyp - loyaltyDiscountSyp + shippingSyp);

  const applyCode = useCallback(async () => {
    if (!codeInput.trim()) return;
    setApplyingCode(true); setCodeError('');
    try {
      const res  = await fetch('/api/cart/apply-discount', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMap: Record<string, string> = {
          invalid_code: t('errors.invalidCode'), code_expired: t('errors.codeExpired'),
          code_maxed: t('errors.codeMaxed'), code_inactive: t('errors.codeInactive'),
          min_order_not_met: t('errors.minOrderNotMet'),
        };
        setCodeError(errMap[data.error] ?? t('errors.invalidCode'));
        setDiscount(null);
      } else {
        setDiscount({
          ...data.discount_code,
          discount_id: data.discount_code?.id,
          discount_amount: data.discount_amount,
          type: data.discount_code?.type,
          value: data.discount_code?.value,
        });
        setCodeError('');
      }
    } catch { setCodeError(t('errors.generic')); }
    finally { setApplyingCode(false); }
  }, [codeInput, subtotal, t]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (items.length === 0) { setFormError(tCart('emptyCart')); return; }
    if (!governorate) { setFormError(t('errors.selectGov')); return; }
    setSubmitting(true); setFormError('');

    const d = Object.fromEntries(new FormData(e.currentTarget as HTMLFormElement));
    try {
      let addressId = selectedAddressId && selectedAddressId !== 'new' ? selectedAddressId : '';
      if (!addressId) {
        const addressResponse = await fetch('/api/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: isAr ? 'عنوان الطلب' : 'Checkout address',
            full_name: d.full_name,
            phone: d.phone,
            governorate: d.governorate,
            city: '',
            street: d.address,
            is_default: addresses.length === 0,
          }),
        });
        const address = await addressResponse.json().catch(() => null);
        if (!addressResponse.ok || !address?.id) throw new Error(address?.error || 'address_save_failed');
        addressId = address.id;
      }

      const res = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey.current },
        body: JSON.stringify({
          address_id: addressId,
          payment_method: 'cod',
          discount_code: discount?.code ?? null,
          loyalty_points_to_use: loyaltyPointsUsed,
          notes: (d.notes as string) || null,
        }),
      });

      if (res.ok) {
        const body = await res.json();
        clearCart();
        router.push(`/orders/${body.order_number}`);
      } else {
        const err = await res.json().catch(() => null);
        if (err?.error === 'min_order_value_not_met') {
          setFormError(`الحد الأدنى للطلب هو ${err.minOrderValue} ل.س`);
        } else {
          setFormError(err?.error ?? t('errors.createFailed'));
        }
        setSubmitting(false);
      }
    } catch {
      setFormError(t('errors.generic'));
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background px-6 py-20" dir={isAr ? "rtl" : "ltr"}>
        <div className="mx-auto max-w-xl text-center space-y-6">
          <div className="text-5xl">🛒</div>
          <h1 className="text-2xl font-black text-text-primary">{tCart('emptyCart')}</h1>
          <p className="text-text-muted">{t('emptyCartMsg')}</p>
          <Link href="/products"
            className="inline-block rounded-2xl bg-primary px-8 py-3 font-bold text-text-primary hover:bg-[#9A7209] transition-colors">
            {tCart('browseProducts')}
          </Link>
        </div>
      </main>
    );
  }

  const inp = "w-full rounded-xl border border-[#E5E0D8] bg-background-card px-3 py-2.5 text-text-primary text-sm outline-none focus:border-primary transition-colors";

  return (
    <main className="min-h-screen bg-background px-4 py-10" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Link href="/cart" className="text-sm text-primary hover:underline">{isAr ? '←' : '→'} {t('backToCart')}</Link>
          <span className="text-[#D1CBC1]">/</span>
          <h1 className="text-2xl font-black text-text-primary">{t('title')}</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

          {/* ── Left: Form ── */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {formError}
              </div>
            )}

            {/* Personal info */}
            <div className="rounded-2xl border border-[#E5E0D8] bg-background-card p-5 space-y-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-black text-text-primary">{t('contactInfo')}</h2>
                {addresses.length > 0 && (
                  <select
                    aria-label={isAr ? 'اختر عنوان التوصيل' : 'Select delivery address'}
                    className="text-xs border rounded px-2 py-1 bg-surface-elevated text-primary outline-none"
                    value={selectedAddressId}
                    onChange={e => setSelectedAddressId(e.target.value)}
                  >
                    <option value="new">{isAr ? '+ عنوان جديد' : '+ New Address'}</option>
                    {addresses.map(a => (
                      <option key={a.id} value={a.id}>{a.label || a.full_name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-text-secondary">{t('fullName')}</label>
                  <input name="full_name" value={formState.full_name} onChange={e => setFormState({...formState, full_name: e.target.value})} required minLength={2} className={inp} placeholder={t('fullNamePlaceholder')} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-text-secondary">{t('phone')}</label>
                  <input name="phone" value={formState.phone} onChange={e => setFormState({...formState, phone: e.target.value})} required type="tel" minLength={7} className={inp} placeholder="09xxxxxxxx" dir="ltr" />
                </div>
              </div>
            </div>

            {/* Delivery */}
            <div className="rounded-2xl border border-[#E5E0D8] bg-background-card p-5 space-y-4 shadow-sm">
              <h2 className="font-black text-text-primary">{t('deliveryAddress')}</h2>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-text-secondary">{t('governorate')}</label>
                <select name="governorate" required className={inp} value={governorate}
                  onChange={e => setGovernorate((e.target as any).value)}>
                  <option value="">{t('selectGov')}</option>
                  {GOVS.map(g => <option key={g.id} value={g.id}>{isAr ? g.ar : g.id}</option>)}
                </select>
                {/* Shipping cost indicator */}
                {governorate && (
                  <p className="mt-1.5 text-xs text-text-muted">
                    {loadingShip ? t('calcShipping') :
                     shippingSyp === 0 ? t('freeShipping') :
                     <span className="flex gap-1">{t('shippingFee')} <PriceDisplay amountSyp={shippingSyp} className="!text-xs" /></span>}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-text-secondary">{t('detailedAddress')}</label>
                <textarea name="address" required minLength={5} rows={3}
                  className={`${inp} resize-none`} placeholder={t('addressPlaceholder')} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-text-secondary">
                  {t('notes')} <span className="font-normal text-text-muted">({t('optional')})</span>
                </label>
                <textarea name="notes" rows={2} className={`${inp} resize-none`}
                  placeholder={t('notesPlaceholder')} />
              </div>
            </div>

            {/* Discount code */}
            <div className="rounded-2xl border border-[#E5E0D8] bg-background-card p-5 space-y-3 shadow-sm">
              <h2 className="font-black text-text-primary">{t('discountCode')}</h2>
              {discount ? (
                <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                  <span className="text-sm font-bold text-green-700">
                    <span className="flex items-center gap-1">✓ {t('codeApplied')} {discount.type === 'percentage' ? `${discount.value}%` : <PriceDisplay amountSyp={discount.discount_amount} className="!text-sm" />}</span>
                  </span>
                  <button type="button" onClick={() => { setDiscount(null); setCodeInput(''); setCodeError(''); }}
                    className={`text-xs font-bold text-red-500 hover:underline ${isAr ? 'mr-3' : 'ml-3'}`}>
                    {t('remove')}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input type="text" value={codeInput}
                    onChange={e => setCodeInput((e.target as any).value.toUpperCase())}
                    placeholder="EURO2026" className={`${inp} flex-1 font-mono`} dir="ltr" />
                  <button type="button" onClick={() => void applyCode()}
                    disabled={applyingCode || !codeInput.trim()}
                    className="rounded-xl border-2 border-primary px-5 py-2 text-sm font-bold text-primary hover:bg-primary hover:text-text-primary transition-all disabled:opacity-40">
                    {applyingCode ? '...' : t('apply')}
                  </button>
                </div>
              )}
              {codeError && <p className="text-xs text-red-600">{codeError}</p>}
            </div>

            {/* Loyalty points */}
            {loyaltyPoints > 0 && (
              <div className="rounded-2xl border border-[#E5E0D8] bg-background-card p-5 shadow-sm">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={usePoints}
                    onChange={e => setUsePoints((e.target as HTMLInputElement).checked)}
                    className="mt-0.5 h-4 w-4 accent-[#B8860B]" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-text-primary">{t('usePoints')}</p>
                    <p className="text-xs text-text-muted">
                      <span className="flex items-center gap-1">{t('youHavePoints', { points: loyaltyPoints.toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US'), fallback: `لديك ${loyaltyPoints} نقطة` })} · {t('equalsTo')} <PriceDisplay amountSyp={loyaltyPoints * POINT_VAL} className="!text-xs" /></span>
                    </p>
                    {usePoints && loyaltyDiscountSyp > 0 && (
                      <div className="flex items-center gap-1 text-xs font-bold text-primary">{t('willDeduct')} <PriceDisplay amountSyp={loyaltyDiscountSyp} className="!text-xs" /></div>
                    )}
                  </div>
                </label>
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full rounded-2xl bg-primary py-4 text-base font-black text-text-primary hover:bg-[#9A7209] transition-colors disabled:opacity-50 active:scale-[0.98]">
              {submitting ? t('processing') : t('confirmOrder')}
            </button>
          </form>

          {/* ── Right: Summary ── */}
          <div className="h-fit sticky top-6 space-y-4">
            <div className="rounded-2xl border border-[#E5E0D8] bg-background-card p-5 shadow-sm">
              <h2 className="mb-4 font-black text-text-primary">{tCart('orderSummary')} ({items.length} {tCart('productWord')})</h2>
              <div className="space-y-3">
                {items.map((i: any) => (
                  <div key={`${i.itemType ?? 'variant'}:${i.variantId}`} className="flex items-center gap-3">
                    {i.imageUrl && (
                      <img src={i.imageUrl} alt={isAr ? i.nameAr : (i.nameEn || i.nameAr)}
                        className="h-12 w-12 rounded-xl object-cover border border-[#E5E0D8] flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{isAr ? i.nameAr : (i.nameEn || i.nameAr)}</p>
                      <p className="text-xs text-text-muted">{i.sku} · {tCart('qty')}: {i.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-primary shrink-0">
                      <PriceDisplay amountSyp={i.priceSyp * i.quantity} className="!text-sm" />
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-2 border-t border-[#F0ECE6] pt-4 text-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>{t('subtotal')}</span>
                  <div><PriceDisplay amountSyp={subtotal} className="!text-sm" /></div>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>{t('shipping')}</span>
                  <span>
                    {!governorate ? <span className="text-text-muted">—</span> :
                     loadingShip ? '...' :
                     shippingSyp === 0 ? <span className="text-green-600 font-bold">{t('free')}</span> :
                     <PriceDisplay amountSyp={shippingSyp} className="!text-sm" />}
                  </span>
                </div>
                {discountSyp > 0 && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>{t('codeDiscount')}</span>
                    <div className="flex gap-1">- <PriceDisplay amountSyp={discountSyp} className="!text-sm" /></div>
                  </div>
                )}
                {loyaltyDiscountSyp > 0 && (
                  <div className="flex justify-between text-primary font-semibold">
                    <span>{t('pointsDiscount')}</span>
                    <div className="flex gap-1">- <PriceDisplay amountSyp={loyaltyDiscountSyp} className="!text-sm" /></div>
                  </div>
                )}
                <div className="flex justify-between border-t border-[#F0ECE6] pt-3 text-base font-black text-text-primary">
                  <span>{tCart('total')}</span>
                  <div className="text-primary"><PriceDisplay amountSyp={totalSyp} className="!text-base" /></div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E5E0D8] bg-[#FFF8ED] p-4 text-center text-xs text-text-secondary">
              {tCart('contactConfirmMsg')}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
