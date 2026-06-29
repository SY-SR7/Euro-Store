'use client';
import Link from 'next/link';
import { Search, Menu, X, User, Star, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { CartBadge } from '@/components/cart/CartBadge';
import { useState } from 'react';

const DESKTOP_LINKS = [
  { href: '/',           key: 'nav.home'       },
  { href: '/products',   key: 'nav.products'   },
  { href: '/categories', key: 'nav.categories' },
  { href: '/loyalty',    key: 'nav.loyalty'    },
  { href: '/exchange',   key: 'nav.exchange'   },
];

const MOBILE_EXTRAS = [
  { href: '/orders',  key: 'orders.title' },
  { href: '/account', key: 'nav.account'  },
];

export function Header() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-primary">
          Euro Store
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-6">
          {DESKTOP_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-gray-600 hover:text-primary transition-colors">
              {t(l.key)}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button aria-label={t('search')} className="p-2 text-gray-500 hover:text-primary">
            <Search size={20} />
          </button>
          <Link href="/account" aria-label={t('nav.account')} className="p-2 text-gray-500 hover:text-primary">
            <User size={20} />
          </Link>
          <Link href="/loyalty" aria-label={t('nav.loyalty')} className="p-2 text-gray-500 hover:text-primary">
            <Star size={20} />
          </Link>
          <Link href="/exchange" aria-label={t('nav.exchange')} className="p-2 text-gray-500 hover:text-primary">
            <RefreshCw size={20} />
          </Link>
          <CartBadge />
          <LanguageSwitcher />

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-gray-500"
            onClick={() => setOpen((v) => !v)}
            aria-label="menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <nav className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-3">
          {[...DESKTOP_LINKS, ...MOBILE_EXTRAS].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-gray-700 hover:text-primary"
              onClick={() => setOpen(false)}
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

