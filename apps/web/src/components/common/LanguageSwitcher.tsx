/* eslint-disable */
// @ts-nocheck
'use client';

import { useTranslations } from 'next-intl';

const locales = ['ar', 'en'] as const;
type Locale = (typeof locales)[number];

export function LanguageSwitcher() {
  function setLocale(locale: Locale) {
    document.cookie = `EUROSTORE_LOCALE=${locale};max-age=${60 * 60 * 24 * 365};path=/;samesite=lax`;
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-1 text-xs">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className="px-2 py-1 rounded text-[#9CA3AF] hover:text-[#C9A84C] transition-colors uppercase tracking-wider font-medium"
        >
          {l === 'ar' ? 'Ø¹' : 'EN'}
        </button>
      ))}
    </div>
  );
}

