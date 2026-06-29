'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';

export function LanguageSwitcher() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('common');
  const [isPending, startTransition] = useTransition();

  function setLocale(nextLocale: 'ar' | 'en') {
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = `EUROSTORE_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = nextLocale;
    document.documentElement.dir = nextLocale === 'ar' ? 'rtl' : 'ltr';

    startTransition(() => {
      router.refresh();
      window.location.reload();
    });
  }

  const nextLocale = locale === 'ar' ? 'en' : 'ar';
  const label = nextLocale === 'ar' ? t('arabicShort') : t('englishShort');

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => setLocale(nextLocale)}
      className="inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-semibold hover:bg-black/5 disabled:opacity-50"
      aria-label={label}
    >
      {label}
    </button>
  );
}

export default LanguageSwitcher;