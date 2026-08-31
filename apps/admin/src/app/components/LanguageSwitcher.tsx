'use client';
import { useLocale, useTranslations } from 'next-intl';

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations('common');

  function setLocale(nextLocale: 'ar' | 'en') {
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = `EUROSTORE_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = nextLocale;
    document.documentElement.dir = nextLocale === 'ar' ? 'rtl' : 'ltr';
    window.location.reload();
  }

  const nextLocale = locale === 'ar' ? 'en' : 'ar';
  const label = nextLocale === 'ar' ? t('arabicShort', { fallback: 'عربي' }) : t('englishShort', { fallback: 'EN' });

  return (
    <button
      type="button"
      onClick={() => setLocale(nextLocale)}
      className="inline-flex h-8 items-center justify-center rounded-lg border border-transparent px-3 text-xs font-bold text-text-secondary transition-colors hover:bg-background-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      aria-label={label}
    >
      {label}
    </button>
  );
}

export default LanguageSwitcher;
