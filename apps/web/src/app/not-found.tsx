'use client';

import Link from 'next/link';
import { Home, ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('errorPages');
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-xl text-center">
        <p className="text-7xl font-black text-primary">404</p>
        <p className="mt-2 text-sm font-black uppercase text-text-muted">{t('pageNotFound')}</p>
        <h1 className="mt-8 text-3xl font-bold text-text-primary">{t('notFoundTitle')}</h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-text-secondary">{t('notFoundDescription')}</p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-black text-[#0F0F0F] sm:w-auto">
            <Home size={19} /> {t('home')}
          </Link>
          <Link href="/products" className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background-elevated px-6 py-3 font-bold text-text-primary sm:w-auto">
            <ShoppingBag size={19} /> {t('shopNow')}
          </Link>
        </div>
      </div>
    </main>
  );
}
