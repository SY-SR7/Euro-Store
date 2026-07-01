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
  const label = nextLocale === 'ar' ? t('arabicShort') : t('englishShort');

  return (
    <button
      type="button"
      onClick={() => setLocale(nextLocale)}
      className="inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-semibold hover:bg-background-card/5"
      aria-label={label}
    >
      {label}
    </button>
  );
}

export default LanguageSwitcher;