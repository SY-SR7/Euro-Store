'use client';
import Link from 'next/link';
import { Search, Menu, X, User, ShoppingBag, Star, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { CartBadge } from '@/components/cart/CartBadge';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/',           labelKey: 'nav.home'       },
  { href: '/products',   labelKey: 'nav.products'   },
  { href: '/categories', labelKey: 'nav.categories' },
  { href: '/loyalty',    labelKey: 'nav.loyalty'    },
  { href: '/exchange',   labelKey: 'nav.exchange'   },
];

export function Header() {
  const t = useTranslations();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[100] w-full backdrop-blur-md bg-[#121414]/80 border-b border-[#2E2E2E]">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">

        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 text-[#E2E2E2] hover:text-[#C9A84C] transition-colors"
          onClick={() => setMobileOpen(o => !o)}
          aria-label="القائمة"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Logo */}
        <Link href="/" className="font-headline text-2xl tracking-wider text-[#C9A84C] flex-shrink-0">
          EUROSTORE
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map(({ href, labelKey }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-[#E2E2E2] hover:text-[#C9A84C] transition-colors"
            >
              {t(labelKey)}
            </Link>
          ))}
        </nav>

        {/* Right icons */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/products?q="
            className="p-2 text-[#E2E2E2] hover:text-[#C9A84C] transition-colors"
            aria-label={t('common.search')}
          >
            <Search className="w-5 h-5" />
          </Link>
          <Link
            href="/account"
            className="p-2 text-[#E2E2E2] hover:text-[#C9A84C] transition-colors hidden sm:block"
            aria-label={t('nav.account')}
          >
            <User className="w-5 h-5" />
          </Link>
          <CartBadge />
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <nav className="lg:hidden border-t border-[#2E2E2E] bg-[#0F0F0F] px-6 py-5 flex flex-col gap-4">
          {NAV_LINKS.map(({ href, labelKey }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 text-sm text-[#E2E2E2] hover:text-[#C9A84C] transition-colors py-1"
            >
              {labelKey === 'nav.loyalty'  && <Star    className="w-4 h-4 text-[#C9A84C]" />}
              {labelKey === 'nav.exchange' && <RefreshCw className="w-4 h-4 text-[#C9A84C]" />}
              {labelKey === 'nav.cart'     && <ShoppingBag className="w-4 h-4 text-[#C9A84C]" />}
              {t(labelKey)}
            </Link>
          ))}
          <div className="border-t border-[#2E2E2E] pt-3">
            <Link
              href="/orders"
              onClick={() => setMobileOpen(false)}
              className="text-sm text-[#E2E2E2] hover:text-[#C9A84C] transition-colors"
            >
              {t('orders.title')}
            </Link>
          </div>
          <Link
            href="/account"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 text-sm text-[#E2E2E2] hover:text-[#C9A84C]"
          >
            <User className="w-4 h-4" />
            {t('nav.account')}
          </Link>
        </nav>
      )}
    </header>
  );
}