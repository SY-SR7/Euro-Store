import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('footer');
  const tCommon = useTranslations('common');
  return (
    <footer className="border-t border-border bg-[#F8F6F2] pt-14 pb-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 sm:grid-cols-3 mb-10">
          <div>
            <p className="text-lg font-black tracking-widest text-primary mb-3">{tCommon('appName')}</p>
            <p className="text-sm leading-7 text-text-muted">{t('description')}</p>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-text-primary mb-5">{t('shopSection')}</h4>
            <ul className="space-y-3">
              <li><Link href="/products" className="text-sm text-text-secondary hover:text-primary transition-colors">{t('newArrivals')}</Link></li>
              <li><Link href="/categories" className="text-sm text-text-secondary hover:text-primary transition-colors">{t('categories')}</Link></li>
              <li><Link href="/products?sale=true" className="text-sm text-text-secondary hover:text-primary transition-colors">{t('sales')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-text-primary mb-5">{t('helpSection')}</h4>
            <ul className="space-y-3">
              <li><Link href="/faq" className="text-sm text-text-secondary hover:text-primary transition-colors">{t('faq')}</Link></li>
              <li><Link href="/exchange" className="text-sm text-text-secondary hover:text-primary transition-colors">{t('exchangePolicy')}</Link></li>
              <li><Link href="/contact" className="text-sm text-text-secondary hover:text-primary transition-colors">{t('contact')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-6 text-center text-xs text-text-muted">
          <p>© {new Date().getFullYear()} EuroStore · {tCommon('rightsReserved')}</p>
        </div>
      </div>
    </footer>
  );
}