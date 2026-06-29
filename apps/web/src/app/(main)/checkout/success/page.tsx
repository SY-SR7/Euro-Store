'use client';
/* eslint-disable */
// @ts-nocheck
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle } from 'lucide-react';

export default function CheckoutSuccessPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-center">
      <div className="flex justify-center mb-6">
        <CheckCircle className="w-20 h-20 text-green-400" strokeWidth={1.5} />
      </div>

      <h1 className="font-headline text-3xl font-bold text-[#E2E2E2] mb-3">
        {t('checkout.successTitle')}
      </h1>

      {orderNumber && (
        <p className="text-sm text-[#9CA3AF] mb-6">
          {t('checkout.orderNumber')}{' '}
          <span className="font-mono text-[#C9A84C] font-semibold">
            #{orderNumber}
          </span>
        </p>
      )}

      <p className="text-[#9CA3AF] mb-10 leading-7">
        {t('checkout.successDesc')}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {orderNumber && (
          <Link
            href="/orders"
            className="rounded-sm bg-[#C9A84C] px-6 py-3 text-sm font-semibold text-[#111] hover:bg-[#D8B95F] transition-colors"
          >
            {t('checkout.viewOrder')}
          </Link>
        )}
        <Link
          href="/products"
          className="rounded-sm border border-[#2E2E2E] px-6 py-3 text-sm font-semibold text-[#9CA3AF] hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
        >
          {t('home.shopNow')}
        </Link>
      </div>

      {countdown > 0 && (
        <p className="mt-8 text-xs text-[#6B7280]">
          {t('checkout.redirecting', { seconds: countdown })}
        </p>
      )}
    </div>
  );
}
