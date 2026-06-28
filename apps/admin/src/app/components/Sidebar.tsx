'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, Package, ShoppingCart, Users, Settings } from 'lucide-react';

export function Sidebar() {
  const t = useTranslations('admin.sidebar');
  const items = [
    { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
    { key: 'products',  href: '/products',  icon: Package },
    { key: 'orders',    href: '/orders',     icon: ShoppingCart },
    { key: 'helpers',   href: '/team/helpers', icon: Users },
    { key: 'partners',  href: '/team/partners', icon: Users },
    { key: 'settings',  href: '/settings',   icon: Settings },
  ] as const;

  return (
    <aside className="w-60 border-e border-[#2E2E2E] bg-[#0A0A0A] min-h-screen p-4 flex flex-col gap-1">
      <p className="text-xl font-semibold text-[#C9A84C] px-3 py-4">EUROSTORE</p>
      {items.map(({ key, href, icon: Icon }) => (
        <Link key={key} href={href} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[#9CA3AF] hover:bg-[#1C1C1C] hover:text-[#E2E2E2] transition-colors">
          <Icon className="w-4 h-4" />
          {t(key)}
        </Link>
      ))}
    </aside>
  );
}
