'use client';

import { Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('errorPages');
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-xl text-center">
        <p className="text-7xl font-black text-red-600">500</p>
        <p className="mt-2 text-sm font-black uppercase text-text-muted">{t('systemError')}</p>
        <h1 className="mt-8 text-3xl font-bold text-text-primary">{t('unexpectedTitle')}</h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-text-secondary">{t('unexpectedDescription')}</p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button onClick={reset} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-black text-[#0F0F0F] sm:w-auto">
            <RefreshCw size={19} /> {t('tryAgain')}
          </button>
          <Link href="/" className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background-elevated px-6 py-3 font-bold text-text-primary sm:w-auto">
            <Home size={19} /> {t('home')}
          </Link>
        </div>
      </div>
    </main>
  );
}
