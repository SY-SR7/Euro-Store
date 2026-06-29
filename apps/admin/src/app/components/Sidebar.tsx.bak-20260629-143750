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
  Menu,
  Package,
  Percent,
  RefreshCw,
  Settings,
  ShoppingCart,
  Star,
  Tag,
  Truck,
  UserCog,
  Users,
  X
} from 'lucide-react';
import { useState } from 'react';

const navGroups = [
  {
    titleKey: 'admin.operations',
    items: [
      { href: '/', icon: LayoutDashboard, labelKey: 'admin.dashboard' },
      { href: '/orders', icon: ShoppingCart, labelKey: 'admin.orders' },
      { href: '/customers', icon: Users, labelKey: 'admin.customers' },
      { href: '/exchanges', icon: RefreshCw, labelKey: 'admin.exchanges' }
    ]
  },
  {
    titleKey: 'admin.catalogManagement',
    items: [
      { href: '/products', icon: Package, labelKey: 'adminCatalog.products' },
      { href: '/categories', icon: Tag, labelKey: 'adminCatalog.categories' },
      { href: '/brands', icon: Bookmark, labelKey: 'adminCatalog.brands' },
      { href: '/homepage', icon: Home, labelKey: 'adminCatalog.homepageSections' },
      { href: '/discounts', icon: Percent, labelKey: 'admin.discounts' }
    ]
  },
  {
    titleKey: 'admin.systemManagement',
    items: [
      { href: '/shipping-rates', icon: Truck, labelKey: 'admin.shippingRates' },
      { href: '/loyalty-settings', icon: Star, labelKey: 'admin.loyaltySettings' },
      { href: '/sub-admins', icon: UserCog, labelKey: 'admin.subAdmins' },
      { href: '/audit-logs', icon: FileText, labelKey: 'admin.auditLogs' },
      { href: '/settings', icon: Settings, labelKey: 'admin.settings' }
    ]
  }
] as const;

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <>
      <Link
        href="/"
        onClick={onNavigate}
        className="block rounded-3xl border border-[#C9A84C]/25 bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] p-5 shadow-2xl"
      >
        <div className="text-xl font-black tracking-[0.22em] text-[#C9A84C]">EUROSTORE</div>
        <div className="mt-1 text-sm text-[#B8B1A4]">{t('admin.panel')}</div>
      </Link>

      <nav className="mt-6 space-y-7">
        {navGroups.map((group) => (
          <div key={group.titleKey}>
            <div className="mb-2 px-3 text-xs font-black uppercase tracking-[0.22em] text-[#7E766B]">
              {t(group.titleKey)}
            </div>

            <div className="space-y-1">
              {group.items.map(({ href, icon: Icon, labelKey }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href));

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    className={[
                      'group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition',
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
            </div>
          </div>
        ))}
      </nav>

      <form action="/api/auth/logout" method="post" className="mt-8">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-2xl border border-white/10 px-3 py-3 text-sm font-bold text-[#D8D1C5] transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-200"
        >
          <LogOut className="h-4 w-4" />
          <span>{t('auth.logout')}</span>
        </button>
      </form>
    </>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const t = useTranslations();

  return (
    <>
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-72 overflow-y-auto border-e border-white/10 bg-[#0E0E0E]/95 p-5 shadow-2xl backdrop-blur md:block">
        <NavContent />
      </aside>

      <div className="sticky top-0 z-50 mb-5 rounded-3xl border border-white/10 bg-[#101010]/95 p-3 shadow-2xl backdrop-blur md:hidden">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm font-black tracking-[0.2em] text-[#C9A84C]">
            EUROSTORE
          </Link>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-2xl border border-white/10 p-2 text-white"
            aria-label="Admin menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open ? (
          <div className="mt-4 max-h-[75vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0A0A0A] p-4">
            <div className="mb-3 text-sm font-bold text-[#B8B1A4]">{t('admin.panel')}</div>
            <NavContent onNavigate={() => setOpen(false)} />
          </div>
        ) : null}
      </div>
    </>
  );
}