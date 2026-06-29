'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Bookmark,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Package,
  Percent,
  RefreshCw,
  Settings,
  ShoppingCart,
  Star,
  Tag,
  Truck,
  UserCog,
  Users
} from 'lucide-react';

const navItems = [
  { href: '/', icon: LayoutDashboard, labelKey: 'admin.dashboard' },
  { href: '/products', icon: Package, labelKey: 'adminCatalog.products' },
  { href: '/categories', icon: Tag, labelKey: 'adminCatalog.categories' },
  { href: '/brands', icon: Bookmark, labelKey: 'adminCatalog.brands' },
  { href: '/orders', icon: ShoppingCart, labelKey: 'admin.orders' },
  { href: '/customers', icon: Users, labelKey: 'admin.customers' },
  { href: '/exchanges', icon: RefreshCw, labelKey: 'admin.exchanges' },
  { href: '/discounts', icon: Percent, labelKey: 'admin.discounts' },
  { href: '/homepage', icon: Home, labelKey: 'adminCatalog.homepageSections' },
  { href: '/shipping-rates', icon: Truck, labelKey: 'admin.shippingRates' },
  { href: '/loyalty-settings', icon: Star, labelKey: 'admin.loyaltySettings' },
  { href: '/sub-admins', icon: UserCog, labelKey: 'admin.subAdmins' },
  { href: '/settings', icon: Settings, labelKey: 'admin.settings' },
  { href: '/audit-logs', icon: FileText, labelKey: 'admin.auditLogs' }
] as const;

export function Sidebar() {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 start-0 z-40 hidden w-72 border-e border-white/10 bg-[#0E0E0E]/95 p-5 shadow-2xl backdrop-blur md:flex md:flex-col">
      <Link href="/" className="mb-8 block rounded-2xl border border-[#C9A84C]/25 bg-[#151515] p-4">
        <div className="text-lg font-black tracking-[0.22em] text-[#C9A84C]">EUROSTORE</div>
        <div className="mt-1 text-sm text-[#B8B1A4]">{t('admin.panel')}</div>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto pe-1">
        {navItems.map(({ href, icon: Icon, labelKey }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
                active
                  ? 'bg-[#C9A84C] text-[#111111] shadow-lg shadow-[#C9A84C]/10'
                  : 'text-[#D8D1C5] hover:bg-white/5 hover:text-white'
              ].join(' ')}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{t(labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      <form action="/api/auth/logout" method="post" className="pt-4">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-[#D8D1C5] transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-200"
        >
          <LogOut className="h-4 w-4" />
          <span>{t('auth.logout')}</span>
        </button>
      </form>
    </aside>
  );
}