'use client';
import Link from 'next/link';
import { Search, Menu, User, ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { CartBadge } from '@/components/cart/CartBadge';
import { useState } from 'react';

export function Header() {
  const t = useTranslations();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[100] w-full backdrop-blur-md bg-[#121414]/80 border-b border-[#2E2E2E]">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
        <button
          className="lg:hidden p-2 text-[#E2E2E2] hover:text-[#C9A84C] transition-colors"
          onClick={() => setMobileOpen(o => !o)}
        >
          <Menu className="w-6 h-6" />
        </button>

        <Link href="/" className="font-headline text-2xl tracking-wider text-[#C9A84C] flex-shrink-0">
          EUROSTORE
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          <Link href="/"           className="text-sm font-medium text-[#E2E2E2] hover:text-[#C9A84C] transition-colors">{t('nav.home')}</Link>
          <Link href="/products"   className="text-sm font-medium text-[#E2E2E2] hover:text-[#C9A84C] transition-colors">{t('nav.products')}</Link>
          <Link href="/categories" className="text-sm font-medium text-[#E2E2E2] hover:text-[#C9A84C] transition-colors">{t('nav.categories')}</Link>
        </nav>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link href="/products?q=" className="p-2 text-[#E2E2E2] hover:text-[#C9A84C] transition-colors" aria-label={t('common.search')}>
            <Search className="w-5 h-5" />
          </Link>
          <Link href="/account" className="p-2 text-[#E2E2E2] hover:text-[#C9A84C] transition-colors hidden sm:block" aria-label={t('nav.account')}>
            <User className="w-5 h-5" />
          </Link>
          <CartBadge />
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="lg:hidden border-t border-[#2E2E2E] bg-[#0F0F0F] px-6 py-4 flex flex-col gap-3">
          <Link href="/"           onClick={() => setMobileOpen(false)} className="text-sm text-[#E2E2E2] hover:text-[#C9A84C]">{t('nav.home')}</Link>
          <Link href="/products"   onClick={() => setMobileOpen(false)} className="text-sm text-[#E2E2E2] hover:text-[#C9A84C]">{t('nav.products')}</Link>
          <Link href="/categories" onClick={() => setMobileOpen(false)} className="text-sm text-[#E2E2E2] hover:text-[#C9A84C]">{t('nav.categories')}</Link>
          <Link href="/orders"     onClick={() => setMobileOpen(false)} className="text-sm text-[#E2E2E2] hover:text-[#C9A84C]">{t('orders.title')}</Link>
          <Link href="/loyalty"    onClick={() => setMobileOpen(false)} className="text-sm text-[#E2E2E2] hover:text-[#C9A84C]">{t('loyalty.title')}</Link>
          <Link href="/account"    onClick={() => setMobileOpen(false)} className="text-sm text-[#E2E2E2] hover:text-[#C9A84C]">{t('nav.account')}</Link>
        </nav>
      )}
    </header>
  );
}