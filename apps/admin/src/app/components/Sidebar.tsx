'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard, Package, Tag, Bookmark,
  ShoppingCart, Home, LogOut
} from 'lucide-react';

const navItems = [
  { href: '/',                icon: LayoutDashboard, labelKey: 'admin.dashboard'       },
  { href: '/products',        icon: Package,         labelKey: 'adminCatalog.products'  },
  { href: '/categories',      icon: Tag,             labelKey: 'adminCatalog.categories'},
  { href: '/brands',          icon: Bookmark,        labelKey: 'adminCatalog.brands'    },
  { href: '/orders',          icon: ShoppingCart,    labelKey: 'admin.orders'           },
  { href: '/homepage',        icon: Home,            labelKey: 'adminCatalog.homepageSections' },
];

export function Sidebar() {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col bg-[#111111] border-e border-[#2E2E2E]">
      <div className="flex h-20 items-center px-6 border-b border-[#2E2E2E]">
        <span className="font-headline text-xl text-[#C9A84C] tracking-wider">EUROSTORE</span>
        <span className="ms-2 text-xs text-[#9CA3AF]">{t('admin.panel')}</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map(({ href, icon: Icon, labelKey }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? 'bg-[#C9A84C]/10 text-[#C9A84C]'
                  : 'text-[#9CA3AF] hover:bg-[#1A1A1A] hover:text-[#E2E2E2]'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#2E2E2E]">
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#9CA3AF] hover:bg-[#1A1A1A] hover:text-red-400 transition-colors">
            <LogOut className="h-4 w-4" />
            {t('auth.logout')}
          </button>
        </form>
      </div>
    </aside>
  );
}