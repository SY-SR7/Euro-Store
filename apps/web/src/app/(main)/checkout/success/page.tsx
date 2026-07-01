'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

export default function CheckoutSuccessPage() {
  const params      = useSearchParams();
  const orderNumber = params.get('order') ?? '';
  const [counter, setCounter] = useState(8);
  const locale = useLocale();
  const t = useTranslations('checkout');
  const isAr = locale === 'ar';

  useEffect(() => {
    if (counter <= 0) return;
    const t = setTimeout(() => setCounter(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [counter]);

  useEffect(() => {
    if (counter === 0) {
      window.location.href = '/orders';
    }
  }, [counter]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4" dir={isAr ? "rtl" : "ltr"}>
      <div className="max-w-md w-full rounded-3xl border border-black/5 bg-white p-10 text-center shadow-xl">
        {/* Success icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-black text-[#171411]">{t('successTitle')}</h1>
        <p className="mt-2 text-[#6F6658] text-sm">{t('successThanks')}</p>

        {orderNumber && (
          <div className="mt-6 rounded-2xl bg-[#F8F5EF] p-4">
            <p className="text-xs text-[#6F6658]">{t('orderNumberLabel')}</p>
            <p className="mt-1 font-mono text-xl font-black text-[#C9A84C]">{orderNumber}</p>
          </div>
        )}

        <p className="mt-6 text-sm text-[#6F6658]">
          {t('contactConfirmMsgSuccess')}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link href="/orders"
            className="rounded-2xl bg-[#C9A84C] py-3 text-sm font-black text-[#111] hover:bg-[#D8B95F] transition-colors block">
            {t('viewOrders')}
          </Link>
          <Link href="/products"
            className="rounded-2xl border border-black/10 py-3 text-sm font-semibold text-[#3C352C] hover:border-[#C9A84C] transition-colors block">
            {t('continueShoppingSuccess')}
          </Link>
        </div>

        {counter > 0 && (
          <p className="mt-4 text-xs text-[#6F6658]">
            {t('redirectMessage', { count: counter, fallback: `سيتم توجيهك لصفحة الطلبات بعد ${counter} ثواني...` })}
          </p>
        )}
      </div>
    </div>
  );
}