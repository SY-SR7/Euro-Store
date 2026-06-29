'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

export function LanguageSwitcher() {
  const router = useRouter();
  const t = useTranslations('common');
  const [isPending, startTransition] = useTransition();

  function setLocale(locale: 'ar' | 'en') {
    document.cookie = `EUROSTORE_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white/80 p-1 text-xs">
      <button type="button" disabled={isPending} onClick={() => setLocale('ar')} className="rounded-full px-2 py-1 hover:bg-black/5">
        {t('arabic')}
      </button>
      <button type="button" disabled={isPending} onClick={() => setLocale('en')} className="rounded-full px-2 py-1 hover:bg-black/5">
        {t('english')}
      </button>
    </div>
  );
}

export default LanguageSwitcher;