'use client';
/* eslint-disable */
// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/cart/cartStore';
import { createBrowserClient } from '@supabase/ssr';

const GOVS = [
  { id: 'damascus', ar: 'دمشق' }, { id: 'aleppo', ar: 'حلب' },
  { id: 'homs', ar: 'حمص' }, { id: 'hama', ar: 'حماة' },
  { id: 'latakia', ar: 'اللاذقية' }, { id: 'tartus', ar: 'طرطوس' },
  { id: 'idlib', ar: 'إدلب' }, { id: 'deir_ez_zor', ar: 'دير الزور' },
  { id: 'raqqa', ar: 'الرقة' }, { id: 'hasakah', ar: 'الحسكة' },
  { id: 'qamishli', ar: 'القامشلي' }, { id: 'daraa', ar: 'درعا' },
  { id: 'quneitra', ar: 'القنيطرة' }, { id: 'suwayda', ar: 'السويداء' },
  { id: 'rural_damascus', ar: 'ريف دمشق' },
];

function fmt(n: number) {
  return Number(n || 0).toLocaleString('ar-SY') + ' ل.س';
}

function getSubtotal(items: any[]) {
  return items.reduce((s: number, i: any) => s + i.priceSyp * i.quantity, 0);
}

function cartToPayload(items: any[]) {
  return items.map((i: any) => ({
    variant_id:    i.variantId,
    quantity:      i.quantity,
    unit_price_syp: i.priceSyp,
    product_snapshot: { name_ar: i.nameAr, sku: i.sku },
  }));
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();

  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState('');

  // Shipping
  const [governorate,  setGovernorate]  = useState('');
  const [shippingRate, setShippingRate] = useState<any>(null);
  const [loadingShip,  setLoadingShip]  = useState(false);

  // Discount
  const [codeInput,    setCodeInput]    = useState('');
  const [applyingCode, setApplyingCode] = useState(false);
  const [codeError,    setCodeError]    = useState('');
  const [discount,     setDiscount]     = useState<any>(null);

  // Loyalty
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [usePoints,     setUsePoints]     = useState(false);
  const [loyaltySettings, setLoyaltySettings] = useState({
    redeem_points_per_syp: 100,
    max_redeem_percent: 30,
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

  // Fetch loyalty
  useEffect(() => {
    fetch('/api/loyalty/balance')
      .then(r => r.ok ? r.json() : { points: 0 })
      .then((d: any) => setLoyaltyPoints(d.points ?? 0))
      .catch(() => {});
    fetch('/api/loyalty/settings')
      .then(r => r.ok ? r.json() : null)
      .then((d: any) => { if (d) setLoyaltySettings({ redeem_points_per_syp: d.redeem_points_per_syp ?? 100, max_redeem_percent: d.max_redeem_percent ?? 30 }); })
      .catch(() => {});
  }, []);

  const shippingSyp: number = (() => {
    if (!shippingRate) return 0;
    if (shippingRate.free_shipping_threshold_syp && subtotal >= shippingRate.free_shipping_threshold_syp) return 0;
    return shippingRate.base_rate_syp ?? 0;
  })();

  const discountSyp = discount?.discount_amount ?? 0;
  const POINT_VAL   = loyaltySettings.redeem_points_per_syp > 0 ? 1 / loyaltySettings.redeem_points_per_syp : 0;
  const MAX_PCT     = loyaltySettings.max_redeem_percent / 100;
  const loyaltyDiscountSyp = (() => {
    if (!usePoints || loyaltyPoints === 0) return 0;
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
      const res  = await fetch('/api/checkout/validate-discount', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeInput.trim(), subtotal_syp: subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMap: Record<string, string> = {
          invalid_code: 'كود غير صالح', code_expired: 'الكود منتهي الصلاحية',
          code_maxed: 'الكود استُنفد', code_inactive: 'الكود غير نشط',
          min_order_not_met: 'الطلب أقل من الحد الأدنى للكود',
        };
        setCodeError(errMap[data.error] ?? 'كود غير صالح');
        setDiscount(null);
      } else {
        setDiscount(data);
        setCodeError('');
      }
    } catch { setCodeError('حدث خطأ، يرجى المحاولة مرة أخرى'); }
    finally { setApplyingCode(false); }
  }, [codeInput, subtotal]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (items.length === 0) { setFormError('السلة فارغة'); return; }
    if (!governorate) { setFormError('الرجاء اختيار المحافظة'); return; }
    setSubmitting(true); setFormError('');

    const d = Object.fromEntries(new FormData(e.currentTarget as HTMLFormElement));
    try {
      const res = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address_snapshot: {
            full_name: d.full_name, phone: d.phone,
            governorate: d.governorate, address: d.address,
            notes: (d.notes as string) || null,
          },
          items: cartToPayload(items),
          subtotal_syp: subtotal,
          discount_syp: discountSyp,
          discount_id: discount?.discount_id ?? null,
          loyalty_points_used: loyaltyPointsUsed,
          loyalty_discount_syp: loyaltyDiscountSyp,
          shipping_syp: shippingSyp,
          total_syp: totalSyp,
          notes: (d.notes as string) || null,
        }),
      });

      if (res.ok) {
        const body = await res.json();
        clearCart();
        router.push(`/orders/${body.order_number}`);
      } else {
        const err = await res.json().catch(() => null);
        setFormError(err?.error ?? 'فشل إنشاء الطلب، يرجى المحاولة مرة أخرى');
        setSubmitting(false);
      }
    } catch {
      setFormError('حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى');
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#FAFAF8] px-6 py-20" dir="rtl">
        <div className="mx-auto max-w-xl text-center space-y-6">
          <div className="text-5xl">🛒</div>
          <h1 className="text-2xl font-black text-[#1C1917]">السلة فارغة</h1>
          <p className="text-[#A8A29E]">أضف منتجات للسلة قبل المتابعة للدفع</p>
          <Link href="/products"
            className="inline-block rounded-2xl bg-[#B8860B] px-8 py-3 font-bold text-white hover:bg-[#9A7209] transition-colors">
            تصفح المنتجات
          </Link>
        </div>
      </main>
    );
  }

  const inp = "w-full rounded-xl border border-[#E5E0D8] bg-white px-3 py-2.5 text-[#1C1917] text-sm outline-none focus:border-[#B8860B] transition-colors";

  return (
    <main className="min-h-screen bg-[#FAFAF8] px-4 py-10" dir="rtl">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Link href="/cart" className="text-sm text-[#B8860B] hover:underline">← السلة</Link>
          <span className="text-[#D1CBC1]">/</span>
          <h1 className="text-2xl font-black text-[#1C1917]">إتمام الطلب</h1>
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
            <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 space-y-4 shadow-sm">
              <h2 className="font-black text-[#1C1917]">معلومات التواصل</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#57534E]">الاسم الكامل *</label>
                  <input name="full_name" required minLength={2} className={inp} placeholder="أحمد محمد" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#57534E]">رقم الهاتف *</label>
                  <input name="phone" required type="tel" minLength={7} className={inp} placeholder="09xxxxxxxx" dir="ltr" />
                </div>
              </div>
            </div>

            {/* Delivery */}
            <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 space-y-4 shadow-sm">
              <h2 className="font-black text-[#1C1917]">عنوان التوصيل</h2>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#57534E]">المحافظة *</label>
                <select name="governorate" required className={inp} value={governorate}
                  onChange={e => setGovernorate((e.target as any).value)}>
                  <option value="">اختر المحافظة</option>
                  {GOVS.map(g => <option key={g.id} value={g.id}>{g.ar}</option>)}
                </select>
                {/* Shipping cost indicator */}
                {governorate && (
                  <p className="mt-1.5 text-xs text-[#A8A29E]">
                    {loadingShip ? 'جاري حساب الشحن...' :
                     shippingSyp === 0 ? '✓ شحن مجاني لهذه المنطقة' :
                     `رسوم الشحن: ${fmt(shippingSyp)}`}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#57534E]">العنوان التفصيلي *</label>
                <textarea name="address" required minLength={5} rows={3}
                  className={`${inp} resize-none`} placeholder="الحي، الشارع، رقم المبنى..." />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#57534E]">
                  ملاحظات <span className="font-normal text-[#A8A29E]">(اختياري)</span>
                </label>
                <textarea name="notes" rows={2} className={`${inp} resize-none`}
                  placeholder="أي تعليمات خاصة للتوصيل..." />
              </div>
            </div>

            {/* Discount code */}
            <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 space-y-3 shadow-sm">
              <h2 className="font-black text-[#1C1917]">كود الخصم</h2>
              {discount ? (
                <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                  <span className="text-sm font-bold text-green-700">
                    ✓ تم تطبيق الكود — خصم {discount.type === 'percentage' ? `${discount.value}%` : fmt(discount.discount_amount)}
                  </span>
                  <button type="button" onClick={() => { setDiscount(null); setCodeInput(''); setCodeError(''); }}
                    className="text-xs font-bold text-red-500 hover:underline mr-3">
                    إزالة
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input type="text" value={codeInput}
                    onChange={e => setCodeInput((e.target as any).value.toUpperCase())}
                    placeholder="EURO2026" className={`${inp} flex-1 font-mono`} dir="ltr" />
                  <button type="button" onClick={() => void applyCode()}
                    disabled={applyingCode || !codeInput.trim()}
                    className="rounded-xl border-2 border-[#B8860B] px-5 py-2 text-sm font-bold text-[#B8860B] hover:bg-[#B8860B] hover:text-white transition-all disabled:opacity-40">
                    {applyingCode ? '...' : 'تطبيق'}
                  </button>
                </div>
              )}
              {codeError && <p className="text-xs text-red-600">{codeError}</p>}
            </div>

            {/* Loyalty points */}
            {loyaltyPoints > 0 && (
              <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={usePoints}
                    onChange={e => setUsePoints((e.target as HTMLInputElement).checked)}
                    className="mt-0.5 h-4 w-4 accent-[#B8860B]" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-[#1C1917]">استخدام نقاطي للحصول على خصم</p>
                    <p className="text-xs text-[#A8A29E]">
                      لديك {loyaltyPoints.toLocaleString()} نقطة · تساوي {fmt(loyaltyPoints * POINT_VAL)}
                    </p>
                    {usePoints && loyaltyDiscountSyp > 0 && (
                      <p className="text-xs font-bold text-[#B8860B]">سيتم خصم {fmt(loyaltyDiscountSyp)}</p>
                    )}
                  </div>
                </label>
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full rounded-2xl bg-[#B8860B] py-4 text-base font-black text-white hover:bg-[#9A7209] transition-colors disabled:opacity-50 active:scale-[0.98]">
              {submitting ? 'جاري معالجة الطلب...' : 'تأكيد الطلب'}
            </button>
          </form>

          {/* ── Right: Summary ── */}
          <div className="h-fit sticky top-6 space-y-4">
            <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-black text-[#1C1917]">ملخص الطلب ({items.length} منتج)</h2>
              <div className="space-y-3">
                {items.map((i: any) => (
                  <div key={i.variantId} className="flex items-center gap-3">
                    {i.imageUrl && (
                      <img src={i.imageUrl} alt={i.nameAr}
                        className="h-12 w-12 rounded-xl object-cover border border-[#E5E0D8] flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1C1917] truncate">{i.nameAr}</p>
                      <p className="text-xs text-[#A8A29E]">{i.sku} · الكمية: {i.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-[#B8860B] shrink-0">
                      {fmt(i.priceSyp * i.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-2 border-t border-[#F0ECE6] pt-4 text-sm">
                <div className="flex justify-between text-[#57534E]">
                  <span>المجموع الفرعي</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#57534E]">
                  <span>الشحن</span>
                  <span>
                    {!governorate ? <span className="text-[#A8A29E]">—</span> :
                     loadingShip ? '...' :
                     shippingSyp === 0 ? <span className="text-green-600 font-bold">مجاني</span> :
                     fmt(shippingSyp)}
                  </span>
                </div>
                {discountSyp > 0 && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>خصم الكود</span>
                    <span>- {fmt(discountSyp)}</span>
                  </div>
                )}
                {loyaltyDiscountSyp > 0 && (
                  <div className="flex justify-between text-[#B8860B] font-semibold">
                    <span>خصم النقاط</span>
                    <span>- {fmt(loyaltyDiscountSyp)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[#F0ECE6] pt-3 text-base font-black text-[#1C1917]">
                  <span>الإجمالي</span>
                  <span className="text-[#B8860B]">{fmt(totalSyp)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E5E0D8] bg-[#FFF8ED] p-4 text-center text-xs text-[#57534E]">
              سيتم التواصل معك هاتفياً لتأكيد الطلب والتحقق من العنوان
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}