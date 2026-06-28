'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, Package, ShoppingCart, Users, Settings, Tag, Award } from 'lucide-react';

export function Sidebar() {
  const t = useTranslations('admin.sidebar');
  const tCat = useTranslations('adminCatalog');
  const items = [
    { label: t('dashboard'),  href: '/',           icon: LayoutDashboard },
    { label: t('products'),   href: '/products',   icon: Package },
    { label: tCat('categoriesTitle'), href: '/categories', icon: Tag },
    { label: tCat('brandsTitle'),     href: '/brands',     icon: Award },
    { label: t('orders'),     href: '/orders',     icon: ShoppingCart },
    { label: t('helpers'),    href: '/team/helpers', icon: Users },
    { label: t('partners'),   href: '/team/partners', icon: Users },
    { label: t('settings'),   href: '/settings',   icon: Settings },
  ];

  return (
    <aside className="w-60 border-e border-[#2E2E2E] bg-[#0A0A0A] min-h-screen p-4 flex flex-col gap-1">
      <p className="text-xl font-semibold text-[#C9A84C] px-3 py-4">EUROSTORE</p>
      {items.map(({ label, href, icon: Icon }) => (
        <Link key={href} href={href} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[#9CA3AF] hover:bg-[#1C1C1C] hover:text-[#E2E2E2] transition-colors">
          <Icon className="w-4 h-4" />
          {label}
        </Link>
      ))}
    </aside>
  );
}
