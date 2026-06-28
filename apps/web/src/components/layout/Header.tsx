'use client';
import Link from 'next/link';
import { Search, Menu, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { CartBadge } from '@/components/cart/CartBadge';

export function Header() {
  const t = useTranslations();
  return (
    <header className="sticky top-0 z-[100] w-full backdrop-blur-md bg-[#121414]/80 border-b border-[#2E2E2E]">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
        <button className="lg:hidden p-2 text-[#E2E2E2] hover:text-[#C9A84C] transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <Link href="/" className="font-headline text-2xl tracking-wider text-[#C9A84C] flex-shrink-0">
          EUROSTORE
        </Link>
        <nav className="hidden lg:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium text-[#E2E2E2] hover:text-[#C9A84C] transition-colors">{t('nav.home')}</Link>
          <Link href="/products" className="text-sm font-medium text-[#E2E2E2] hover:text-[#C9A84C] transition-colors">{t('nav.shop')}</Link>
          <Link href="/categories" className="text-sm font-medium text-[#E2E2E2] hover:text-[#C9A84C] transition-colors">{t('nav.categories')}</Link>
        </nav>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <button className="p-2 text-[#E2E2E2] hover:text-[#C9A84C] transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <Link href="/auth/login" className="p-2 text-[#E2E2E2] hover:text-[#C9A84C] transition-colors hidden sm:block">
            <User className="w-5 h-5" />
          </Link>
          <CartBadge />
        </div>
      </div>
    </header>
  );
}