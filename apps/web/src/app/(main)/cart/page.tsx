'use client';
/* eslint-disable */
// @ts-nocheck
import Link from 'next/link';
import { useCartStore } from '@/lib/cart/cartStore';
import { useLocale, useTranslations } from 'next-intl';

function fmt(n: number, locale: string) {
  return Number(n || 0).toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US') + (locale === 'ar' ? ' ل.س' : ' SYP');
}

export default function CartPage() {
  const { items, removeItem, updateQty, totalSyp } = useCartStore();
  const locale = useLocale();
  const t = useTranslations('cart');
  const isAr = locale === 'ar';

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background px-4 py-20" dir={isAr ? "rtl" : "ltr"}>
        <div className="mx-auto max-w-xl text-center space-y-6">
          <div className="text-5xl">🛒</div>
          <h1 className="text-2xl font-black text-text-primary">{t('emptyCart')}</h1>
          <p className="text-text-muted">{t('addProducts')}</p>
          <Link href="/products"
            className="inline-block rounded-2xl bg-primary px-8 py-3 font-bold text-text-primary hover:bg-[#9A7209] transition-colors">
            {t('browseProducts')}
          </Link>
        </div>
      </main>
    );
  }

  const total = typeof totalSyp === 'function' ? totalSyp() : totalSyp;
  const itemCount = items.reduce((s: number, i: any) => s + i.quantity, 0);

  return (
    <main className="min-h-screen bg-background px-4 py-10" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Link href="/products" className="text-sm text-primary hover:underline">{isAr ? '←' : '→'} {t('continueShopping')}</Link>
          <span className="text-[#D1CBC1]">/</span>
          <h1 className="text-2xl font-black text-text-primary">{t('shoppingCart')}</h1>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">{itemCount}</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Items */}
          <div className="space-y-3">
            {items.map((item: any) => (
              <div key={item.variantId}
                className="flex items-center gap-4 rounded-2xl border border-[#E5E0D8] bg-background-card p-4 shadow-sm">
                {/* Image */}
                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E5E0D8] bg-[#F5F0E8]">
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.nameAr} className="h-full w-full object-cover" />
                    : <span className="text-xs text-primary text-center px-1 leading-tight">{item.nameAr}</span>}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-text-primary truncate">{isAr ? item.nameAr : (item.nameEn || item.nameAr)}</p>
                  <p className="text-xs text-text-muted font-mono mt-0.5">{item.sku}</p>
                  <p className="text-sm font-bold text-primary mt-1">{fmt(item.priceSyp, locale)}</p>
                </div>

                {/* Qty + remove */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => updateQty(item.variantId, item.quantity - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E0D8] text-lg font-bold text-text-secondary hover:border-primary hover:text-primary transition-colors">
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-black text-text-primary">{item.quantity}</span>
                  <button onClick={() => updateQty(item.variantId, item.quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E0D8] text-lg font-bold text-text-secondary hover:border-primary hover:text-primary transition-colors">
                    +
                  </button>
                  <button onClick={() => removeItem(item.variantId)}
                    className="mr-1 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors px-2 py-1">
                    {t('remove')}
                  </button>
                </div>

                {/* Line total */}
                <div className="text-sm font-black text-primary shrink-0 min-w-[80px] text-left">
                  {fmt(item.priceSyp * item.quantity, locale)}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="h-fit sticky top-6 space-y-3">
            <div className="rounded-2xl border border-[#E5E0D8] bg-background-card p-5 shadow-sm">
              <h2 className="mb-4 font-black text-text-primary">{t('orderSummary')}</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>{t('itemsCount')}</span>
                  <span>{itemCount}</span>
                </div>
                <div className="flex justify-between border-t border-[#F0ECE6] pt-3 text-base font-black text-text-primary">
                  <span>{t('total')}</span>
                  <span className="text-primary">{fmt(total, locale)}</span>
                </div>
              </div>
              <Link href="/checkout"
                className="mt-5 block w-full rounded-2xl bg-primary py-3.5 text-center text-base font-black text-text-primary hover:bg-[#9A7209] transition-colors active:scale-[0.98]">
                {t('checkout')}
              </Link>
              <Link href="/products"
                className="mt-3 block w-full rounded-2xl border border-[#E5E0D8] py-3 text-center text-sm font-semibold text-text-secondary hover:border-primary hover:text-primary transition-colors">
                {t('continueShopping')}
              </Link>
            </div>
            <div className="rounded-2xl border border-[#E5E0D8] bg-[#FFF8ED] p-3 text-center text-xs text-text-secondary">
              {t('contactConfirmMsg')}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}