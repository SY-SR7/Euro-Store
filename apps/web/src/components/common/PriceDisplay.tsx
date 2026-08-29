'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useExchangeRateStore } from '@/lib/exchangeRateStore';

interface PriceDisplayProps {
  amountSyp: number;
  className?: string;
}

export function PriceDisplay({ amountSyp, className = '' }: PriceDisplayProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const { rate, setRate } = useExchangeRateStore();
  useEffect(() => {
    // Fetch exchange rate on mount if we haven't already
    if (rate === 15000) { // default value
      fetch('/api/settings/exchange-rate')
        .then(res => res.json())
        .then((data: unknown) => {
          if (data && typeof data === 'object' && !Array.isArray(data)) {
            const nextRate = (data as Record<string, unknown>).rate;
            if (typeof nextRate === 'number' && nextRate > 0) setRate(nextRate);
          }
        })
        .catch(() => undefined);
    }
  }, [rate, setRate]);

  const sypFormatted = Number(amountSyp || 0).toLocaleString(isAr ? 'ar-SY' : 'en-US') + (isAr ? ' ل.س' : ' SYP');
  const usdAmount = amountSyp / (rate || 15000);
  const usdFormatted = '$' + usdAmount.toFixed(2);

  return (
    <div className={`flex items-baseline gap-1.5 ${className}`}>
      <span className="font-bold text-primary">{sypFormatted}</span>
      <span className="text-xs text-text-muted font-medium">({usdFormatted})</span>
    </div>
  );
}
