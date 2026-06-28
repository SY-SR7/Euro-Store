import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('footer');
  const tCommon = useTranslations('common');
  return (
    <footer className="border-t border-[#2E2E2E] bg-[#0A0A0A] pt-16 pb-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 sm:grid-cols-3 mb-12">
          <div>
            <p className="text-xl font-semibold text-[#C9A84C] mb-4">{tCommon('appName')}</p>
            <p className="text-sm leading-7 text-[#9CA3AF]">{t('description')}</p>
          </div>
          <div>
            <h4 className="text-[#E2E2E2] font-semibold mb-6 uppercase tracking-wider text-sm">{t('shopSection')}</h4>
            <ul className="space-y-3">
              <li><Link href="/products" className="text-[#9CA3AF] hover:text-[#C9A84C] text-sm transition-colors">{t('newArrivals')}</Link></li>
              <li><Link href="/categories" className="text-[#9CA3AF] hover:text-[#C9A84C] text-sm transition-colors">{t('categories')}</Link></li>
              <li><Link href="/products?sale=true" className="text-[#9CA3AF] hover:text-[#C9A84C] text-sm transition-colors">{t('sales')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[#E2E2E2] font-semibold mb-6 uppercase tracking-wider text-sm">{t('helpSection')}</h4>
            <ul className="space-y-3">
              <li><Link href="/faq" className="text-[#9CA3AF] hover:text-[#C9A84C] text-sm transition-colors">{t('faq')}</Link></li>
              <li><Link href="/exchange" className="text-[#9CA3AF] hover:text-[#C9A84C] text-sm transition-colors">{t('exchangePolicy')}</Link></li>
              <li><Link href="/contact" className="text-[#9CA3AF] hover:text-[#C9A84C] text-sm transition-colors">{t('contact')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#2E2E2E] pt-8 text-center text-xs text-[#6B7280]">
          <p>© {new Date().getFullYear()} EuroStore · {tCommon('rightsReserved')}</p>
        </div>
      </div>
    </footer>
  );
}
