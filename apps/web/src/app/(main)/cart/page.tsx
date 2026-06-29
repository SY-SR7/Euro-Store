/* eslint-disable */
// @ts-nocheck
'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useCartStore } from '../../lib/cart/cartStore';
import { formatSYP } from '@eurostore/shared';

export default function CartPage() {
  const t                             = useTranslations();
  const { items, removeItem, updateQty, totalSyp } = useCartStore();

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#0F0F0F] px-6 py-10 text-[#E2E2E2]">
        <div className="mx-auto max-w-3xl">
          <nav className="flex items-center justify-between border-b border-[#2E2E2E] pb-5 mb-10">
            <Link href="/" className="text-xl font-semibold text-[#C9A84C]">{t('common.appName')}</Link>
          </nav>
          <div className="rounded-md border border-[#2E2E2E] bg-[#151515] p-12 text-center">
            <p className="text-2xl text-[#9CA3AF] mb-6">{t('cart.empty')}</p>
            <Link href="/products"
              className="rounded-sm bg-[#C9A84C] px-6 py-3 text-sm font-semibold text-[#111] hover:bg-[#D8B95F] transition-colors">
              {t('cart.continueShopping')}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-6 py-10 text-[#E2E2E2]">
      <div className="mx-auto max-w-4xl">
        <nav className="flex items-center justify-between border-b border-[#2E2E2E] pb-5 mb-10">
          <Link href="/" className="text-xl font-semibold text-[#C9A84C]">{t('common.appName')}</Link>
          <Link href="/products" className="text-sm text-[#D6D3C7]">{t('nav.products')}</Link>
        </nav>

        <h1 className="text-3xl font-semibold mb-8">{t('cart.title')}</h1>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Items list */}
          <div className="flex flex-col gap-3">
            {items.map((item: any) => (
              <div key={item.variantId}
                className="flex items-center gap-4 rounded-md border border-[#2E2E2E] bg-[#151515] p-4">
                <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded border border-[#2E2E2E] bg-[#202020] overflow-hidden">
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.nameAr} className="h-full w-full object-cover" />
                    : <span className="text-xs text-[#C9A84C] text-center px-1 leading-tight">{item.nameAr}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#E2E2E2] truncate">{item.nameAr}</p>
                  <p className="text-xs text-[#6B7280] font-mono mt-0.5">{item.sku}</p>
                  <p className="text-[#C9A84C] font-semibold mt-1">{formatSYP(item.priceSyp)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => updateQty(item.variantId, item.quantity - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded border border-[#2E2E2E] text-[#9CA3AF] hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors">
                    âˆ’
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => updateQty(item.variantId, item.quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded border border-[#2E2E2E] text-[#9CA3AF] hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors">
                    +
                  </button>
                  <button onClick={() => removeItem(item.variantId)}
                    className="ms-2 text-xs text-red-400 hover:text-red-300 transition-colors">
                    {t('cart.remove')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="rounded-md border border-[#2E2E2E] bg-[#151515] p-6 h-fit">
            <h2 className="text-lg font-semibold mb-4">{t('cart.orderSummary')}</h2>
            <div className="flex items-center justify-between text-sm text-[#9CA3AF] mb-2">
              <span>{t('cart.itemCount')}</span>
              <span>{items.reduce((s, i) => s + i.quantity, 0)}</span>
            </div>
            <div className="flex items-center justify-between font-semibold text-lg border-t border-[#2E2E2E] pt-4 mt-4">
              <span>{t('cart.total')}</span>
              <span className="text-[#C9A84C]">{formatSYP(totalSyp())}</span>
            </div>
            <Link href="/checkout"
              className="mt-6 block w-full rounded-sm bg-[#C9A84C] py-3 text-center text-sm font-semibold text-[#111] hover:bg-[#D8B95F] transition-colors">
              {t('cart.checkout')}
            </Link>
            <Link href="/products"
              className="mt-3 block w-full rounded-sm border border-[#2E2E2E] py-3 text-center text-sm text-[#9CA3AF] hover:border-[#C9A84C] hover:text-[#E2E2E2] transition-colors">
              {t('cart.continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
