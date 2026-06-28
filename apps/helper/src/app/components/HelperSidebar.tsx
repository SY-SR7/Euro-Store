'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, ShoppingCart, RefreshCw, Gift, LogOut } from 'lucide-react';

const navItems = [
  { href: '/dashboard',  icon: LayoutDashboard, labelKey: 'helper.dashboardTitle' },
  { href: '/orders',     icon: ShoppingCart,    labelKey: 'helper.orderQueue'     },
  { href: '/exchange',   icon: RefreshCw,       labelKey: 'helper.exchangeQueue'  },
  { href: '/loyalty',    icon: Gift,            labelKey: 'helper.grantLoyalty'   },
];

export function HelperSidebar() {
  const t       = useTranslations();
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col bg-[#111111] border-e border-[#2E2E2E]">
      <div className="flex h-16 items-center px-5 border-b border-[#2E2E2E]">
        <span className="font-semibold text-[#C9A84C]">Helper</span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, icon: Icon, labelKey }) => {
          const active = pathname === href || pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              active ? 'bg-[#C9A84C]/10 text-[#C9A84C]' : 'text-[#9CA3AF] hover:bg-[#1A1A1A] hover:text-[#E2E2E2]'
            }`}>
              <Icon className="h-4 w-4" />
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-[#2E2E2E]">
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#9CA3AF] hover:text-red-400 transition-colors">
            <LogOut className="h-4 w-4" />
            {t('auth.logout')}
          </button>
        </form>
      </div>
    </aside>
  );
}