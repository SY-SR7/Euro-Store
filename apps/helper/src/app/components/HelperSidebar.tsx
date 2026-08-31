'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, ShoppingCart, RefreshCw, Gift, PackagePlus, Box, LogOut } from 'lucide-react';

const navItems = [
  { href: '/dashboard',         icon: LayoutDashboard, labelKey: 'helper.dashboardTitle' },
  { href: '/dashboard#order-queue', icon: ShoppingCart, labelKey: 'helper.orderQueue'     },
  { href: '/exchange',          icon: RefreshCw,       labelKey: 'helper.exchangeQueue'  },
  { href: '/inventory',         icon: Box,             labelKey: 'helper.inventory'      },
  { href: '/loyalty',           icon: Gift,            labelKey: 'helper.grantLoyalty'   },
  { href: '/product-requests',  icon: PackagePlus,     labelKey: 'helper.productRequests'},
];

export function HelperSidebar() {
  const t       = useTranslations();
  const pathname = usePathname();

  return (
    <aside className="fixed inset-x-0 bottom-0 z-40 flex w-full flex-col border-t border-border bg-background-card/95 backdrop-blur md:static md:h-full md:w-56 md:border-e md:border-t-0 md:bg-background-card">
      <div className="hidden h-16 items-center border-b border-border px-5 md:flex">
        <span className="font-semibold text-primary">Helper</span>
      </div>
      <nav aria-label={t('helper.dashboardTitle')} className="flex overflow-hidden p-2 md:flex-1 md:flex-col md:space-y-1 md:p-4">
        {navItems.map(({ href, icon: Icon, labelKey }) => {
          const active = pathname === href || pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={`flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[10px] transition-colors md:min-h-11 md:flex-none md:flex-row md:justify-start md:gap-3 md:px-3 md:py-2.5 md:text-sm ${
              active ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-background-secondary hover:text-text-primary'
            }`}>
              <Icon className="h-4 w-4" />
              <span className="w-full truncate text-center md:w-auto md:text-start">{t(labelKey)}</span>
            </Link>
          );
        })}
      </nav>
      <div className="absolute -top-14 end-3 md:static md:border-t md:border-border md:p-4">
        <form action="/api/auth/logout" method="POST">
          <button type="submit" aria-label={t('auth.logout')} className="flex h-11 w-11 items-center justify-center gap-3 rounded-full border border-border bg-background-elevated text-sm text-text-secondary shadow-md transition-colors hover:bg-error/5 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/20 md:w-full md:justify-start md:rounded-lg md:border-0 md:bg-transparent md:px-3 md:py-2.5 md:shadow-none">
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">{t('auth.logout')}</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
