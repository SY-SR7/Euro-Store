'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { ShieldCheck, Mail, Phone } from 'lucide-react';

export function Footer() {
  const t = useTranslations('footer');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isAr = locale === 'ar';

  return (
    <footer className="border-t border-border/80 bg-background-elevated pt-14 pb-8" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          {/* Col 1: Brand Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/images/logo.png" alt="Euro Store" className="h-9 w-auto object-contain" />
              <span className="text-lg font-black tracking-wider text-text-primary">يورو ستور</span>
            </div>
            <p className="text-xs sm:text-sm leading-6 text-text-muted mb-4">
              {t('description')}
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
              <ShieldCheck className="h-4 w-4" />
              <span>{isAr ? 'منتجات أصلية معتمدة' : '100% Authentic Items'}</span>
            </div>
          </div>

          {/* Col 2: Shop & Collections */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-text-primary mb-4">
              {t('shopSection')}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/new-arrivals"
                  className="text-xs sm:text-sm text-text-secondary hover:text-primary transition-colors inline-block font-medium"
                >
                  {t('newArrivals')}
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="text-xs sm:text-sm text-text-secondary hover:text-primary transition-colors inline-block font-medium"
                >
                  {t('categories')}
                </Link>
              </li>
              <li>
                <Link
                  href="/offers"
                  className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 hover:underline transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {t('sales')}
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="text-xs sm:text-sm text-text-secondary hover:text-primary transition-colors inline-block font-medium"
                >
                  {t('allProducts')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Care & Help */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-text-primary mb-4">
              {t('helpSection')}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/faq"
                  className="text-xs sm:text-sm text-text-secondary hover:text-primary transition-colors inline-block"
                >
                  {t('faq')}
                </Link>
              </li>
              <li>
                <Link
                  href="/exchange"
                  className="text-xs sm:text-sm text-text-secondary hover:text-primary transition-colors inline-block"
                >
                  {t('exchangePolicy')}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-xs sm:text-sm text-text-secondary hover:text-primary transition-colors inline-block"
                >
                  {t('contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Policies */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-text-primary mb-4">
              {t('legalSection')}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/privacy"
                  className="text-xs sm:text-sm text-text-secondary hover:text-primary transition-colors inline-block"
                >
                  {t('privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-xs sm:text-sm text-text-secondary hover:text-primary transition-colors inline-block"
                >
                  {t('termsAndConditions')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Copyright & Legal Links */}
        <div className="border-t border-border/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <p>© {new Date().getFullYear()} EuroStore · {tCommon('rightsReserved')}</p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              {t('privacyPolicy')}
            </Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-primary transition-colors">
              {t('termsAndConditions')}
            </Link>
            <span>·</span>
            <Link href="/exchange" className="hover:text-primary transition-colors">
              {t('exchangePolicy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}