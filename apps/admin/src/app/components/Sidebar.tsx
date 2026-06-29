'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
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
import { useEffect, useState } from 'react';

const navGroups = [
  {
    title: 'التشغيل',
    items: [
      { href: '/', icon: LayoutDashboard, label: 'لوحة التحكم' },
      { href: '/orders', icon: ShoppingCart, label: 'الطلبات' },
      { href: '/customers', icon: Users, label: 'العملاء' },
      { href: '/exchanges', icon: RefreshCw, label: 'طلبات الاستبدال' }
    ]
  },
  {
    title: 'الكتالوج',
    items: [
      { href: '/products', icon: Package, label: 'المنتجات' },
      { href: '/categories', icon: Tag, label: 'التصنيفات' },
      { href: '/brands', icon: Bookmark, label: 'العلامات التجارية' },
      { href: '/homepage', icon: Home, label: 'أقسام الواجهة' },
      { href: '/discounts', icon: Percent, label: 'الخصومات' }
    ]
  },
  {
    title: 'النظام',
    items: [
      { href: '/shipping-rates', icon: Truck, label: 'أسعار الشحن' },
      { href: '/loyalty-settings', icon: Star, label: 'إعدادات الولاء' },
      { href: '/sub-admins', icon: UserCog, label: 'المسؤولون الفرعيون' },
      { href: '/audit-logs', icon: FileText, label: 'سجل التدقيق' },
      { href: '/settings', icon: Settings, label: 'الإعدادات' }
    ]
  }
] as const;

function setSidebarSpace(collapsed: boolean) {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--admin-sidebar-space', collapsed ? '5.5rem' : '18rem');
}

function NavContent({
  collapsed,
  onNavigate
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      <Link
        href="/"
        onClick={onNavigate}
        className={[
          'block rounded-3xl border border-[#C9A84C]/25 bg-gradient-to-br from-[#1B1B1B] to-[#0F0F0F] shadow-2xl transition-all',
          collapsed ? 'p-3 text-center' : 'p-5'
        ].join(' ')}
        title="EuroStore"
      >
        <div
          className={[
            'font-black tracking-[0.22em] text-[#C9A84C]',
            collapsed ? 'text-lg tracking-normal' : 'text-xl'
          ].join(' ')}
        >
          {collapsed ? 'ES' : 'EUROSTORE'}
        </div>

        {!collapsed ? (
          <div className="mt-1 text-sm text-[#B8B1A4]">لوحة الإدارة</div>
        ) : null}
      </Link>

      <nav className={collapsed ? 'mt-6 space-y-6' : 'mt-6 space-y-7'}>
        {navGroups.map((group) => (
          <div key={group.title}>
            {!collapsed ? (
              <div className="mb-2 px-3 text-xs font-black uppercase tracking-[0.22em] text-[#7E766B]">
                {group.title}
              </div>
            ) : (
              <div className="mx-auto mb-3 h-px w-8 bg-white/10" />
            )}

            <div className="space-y-1">
              {group.items.map(({ href, icon: Icon, label }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href));

                return (
                  <Link
                    key={href}
                    href={href}
                    title={label}
                    aria-label={label}
                    onClick={onNavigate}
                    className={[
                      'flex items-center rounded-2xl text-sm font-bold transition',
                      collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-3',
                      active
                        ? 'bg-[#C9A84C] text-[#111111] shadow-lg shadow-[#C9A84C]/10'
                        : 'text-[#D8D1C5] hover:bg-white/5 hover:text-white'
                    ].join(' ')}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed ? <span>{label}</span> : null}
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
          title="تسجيل الخروج"
          className={[
            'flex w-full items-center rounded-2xl border border-white/10 text-sm font-bold text-[#D8D1C5] transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-200',
            collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-3'
          ].join(' ')}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed ? <span>تسجيل الخروج</span> : null}
        </button>
      </form>
    </>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem('admin-sidebar-collapsed') === '1';
    setCollapsed(saved);
    setSidebarSpace(saved);
  }, []);

  useEffect(() => {
    setSidebarSpace(collapsed);
    window.localStorage.setItem('admin-sidebar-collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  return (
    <>
      <aside
        className="fixed inset-y-0 right-0 z-40 hidden overflow-y-auto border-l border-white/10 bg-[#0E0E0E]/95 p-5 shadow-2xl backdrop-blur transition-[width] duration-300 md:block"
        style={{ width: collapsed ? '5.5rem' : '18rem' }}
      >
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="mb-4 flex h-10 w-full items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-[#C9A84C] transition hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/10"
          title={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
          aria-label={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
        >
          {collapsed ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>

        <NavContent collapsed={collapsed} />
      </aside>

      <div className="sticky top-0 z-50 mb-5 rounded-3xl border border-white/10 bg-[#101010]/95 p-3 shadow-2xl backdrop-blur md:hidden">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="rounded-2xl border border-white/10 p-2 text-white"
            aria-label="Admin menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/" className="text-sm font-black tracking-[0.2em] text-[#C9A84C]">
            EUROSTORE
          </Link>
        </div>

        {mobileOpen ? (
          <div className="mt-4 max-h-[75vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0A0A0A] p-4">
            <NavContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </div>
        ) : null}
      </div>
    </>
  );
}

export default Sidebar;