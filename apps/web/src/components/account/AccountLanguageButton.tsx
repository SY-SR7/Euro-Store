'use client';
import { useLocale } from 'next-intl';
import { Globe, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useState } from 'react';

export function AccountLanguageButton() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [isOpen, setIsOpen] = useState(false);

  function setLocale(nextLocale: 'ar' | 'en') {
    if (locale === nextLocale) {
      setIsOpen(false);
      return;
    }
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = `EUROSTORE_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = nextLocale;
    document.documentElement.dir = nextLocale === 'ar' ? 'rtl' : 'ltr';
    window.location.reload();
  }

  return (
    <div className="rounded-2xl border border-border bg-background-card overflow-hidden shadow-sm transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 hover:bg-black/5 transition-colors text-start"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEF3C7] text-primary">
            <Globe className="h-5 w-5" />
          </div>
          <span className="font-semibold text-text-primary">{isAr ? 'لغة التطبيق' : 'App Language'}</span>
        </div>
        <div className="flex items-center gap-2 text-text-muted">
          <span className="text-sm font-medium">{isAr ? 'العربية' : 'English'}</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border/50 bg-background/50 p-2 space-y-1">
          <button
            onClick={() => setLocale('ar')}
            className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-start transition-colors ${
              isAr ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-white text-text-secondary'
            }`}
          >
            <span>العربية (Arabic)</span>
            {isAr && <Check className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setLocale('en')}
            className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-start transition-colors ${
              !isAr ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-white text-text-secondary'
            }`}
          >
            <span>English</span>
            {!isAr && <Check className="h-5 w-5" />}
          </button>
        </div>
      )}
    </div>
  );
}
