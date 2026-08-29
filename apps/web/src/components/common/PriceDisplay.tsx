'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useExchangeRateStore } from '@/lib/exchangeRateStore';

interface PriceDisplayProps {
  amountSyp: number;
  originalPriceSyp?: number | null;
  discountPercentage?: number | null;
  className?: string;
  showDiscountBadge?: boolean;
}

export function PriceDisplay({
  amountSyp,
  originalPriceSyp,
  discountPercentage,
  className = '',
  showDiscountBadge = true,
}: PriceDisplayProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const { rate, setRate } = useExchangeRateStore();

  useEffect(() => {
    if (rate === 15000) {
      fetch('/api/settings/exchange-rate')
        .then((res) => res.json())
        .then((data: unknown) => {
          if (data && typeof data === 'object' && !Array.isArray(data)) {
            const nextRate = (data as Record<string, unknown>).rate;
            if (typeof nextRate === 'number' && nextRate > 0) setRate(nextRate);
          }
        })
        .catch(() => undefined);
    }
  }, [rate, setRate]);

  // Calculate discount & original price if missing
  let calculatedOriginalPrice = originalPriceSyp;
  let calculatedDiscount = discountPercentage;

  if (discountPercentage && discountPercentage > 0 && !originalPriceSyp) {
    calculatedOriginalPrice = Math.round(amountSyp / (1 - discountPercentage / 100));
  } else if (originalPriceSyp && originalPriceSyp > amountSyp && !discountPercentage) {
    calculatedDiscount = Math.round(((originalPriceSyp - amountSyp) / originalPriceSyp) * 100);
  }

  const hasDiscount = Boolean(
    (calculatedDiscount && calculatedDiscount > 0) ||
    (calculatedOriginalPrice && calculatedOriginalPrice > amountSyp)
  );

  const sypFormatted = Number(amountSyp || 0).toLocaleString(isAr ? 'ar-SY' : 'en-US') + (isAr ? ' ل.س' : ' SYP');
  const originalSypFormatted = calculatedOriginalPrice
    ? Number(calculatedOriginalPrice).toLocaleString(isAr ? 'ar-SY' : 'en-US') + (isAr ? ' ل.س' : ' SYP')
    : null;

  const usdAmount = amountSyp / (rate || 15000);
  const usdFormatted = '$' + usdAmount.toFixed(2);

  return (
    <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${className}`}>
      {/* Current Selling Price (السعر بعد الخصم) */}
      <span className="font-black text-[#1F1B16] tracking-tight">{sypFormatted}</span>

      {/* Original Price (السعر قبل الخصم) */}
      {hasDiscount && originalSypFormatted && (
        <span className="text-xs text-[#8C827A] line-through font-medium opacity-80 decoration-1">
          {originalSypFormatted}
        </span>
      )}

      {/* Discount Pill Badge */}
      {hasDiscount && calculatedDiscount && showDiscountBadge && (
        <span className="inline-flex items-center rounded-md bg-amber-500/15 border border-amber-400/40 px-1.5 py-0.5 text-[10px] font-black text-amber-900 dark:text-amber-300 leading-none">
          -{calculatedDiscount}%
        </span>
      )}

      {/* USD Equivalent */}
      <span className="text-[11px] text-[#8C827A] font-medium">({usdFormatted})</span>
    </div>
  );
}
