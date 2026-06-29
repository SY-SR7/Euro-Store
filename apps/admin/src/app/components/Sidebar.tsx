'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bookmark, ChevronLeft, ChevronRight, FileText, Home,
  LayoutDashboard, LogOut, Menu, Package, Percent, RefreshCw,
  Settings, ShoppingCart, Star, Tag, Truck, UserCog, Users, X
} from 'lucide-react';
import { useEffect, useState } from 'react';

const navGroups = [
  {
    title: 'التشغيل',
    items: [
      { href: '/', icon: LayoutDashboard, label: 'لوحة التحكم' },
      { href: '/orders', icon: ShoppingCart, label: 'الطلبات' },
      { href: '/customers', icon: Users, label: 'العملاء' },
      { href: '/exchanges', icon: RefreshCw, label: 'طلبات الاستبدال' },
    ],
  },
  {
    title: 'الكتالوج',
    items: [
      { href: '/products', icon: Package, label: 'المنتجات' },
      { href: '/categories', icon: Tag, label: 'التصنيفات' },
      { href: '/brands', icon: Bookmark, label: 'العلامات التجارية' },
      { href: '/homepage', icon: Home, label: 'أقسام الواجهة' },
      { href: '/discounts', icon: Percent, label: 'الخصومات' },
    ],
  },
  {
    title: 'النظام',
    items: [
      { href: '/shipping-rates', icon: Truck, label: 'أسعار الشحن' },
      { href: '/loyalty-settings', icon: Star, label: 'إعدادات الولاء' },
      { href: '/sub-admins', icon: UserCog, label: 'المسؤولون الفرعيون' },
      { href: '/audit-logs', icon: FileText, label: 'سجل التدقيق' },
      { href: '/settings', icon: Settings, label: 'الإعدادات' },
    ],
  },
] as const;

function NavContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      <Link
        href="/"
        onClick={onNavigate}
        className={[
          'flex items-center gap-3 rounded-xl border border-[#E5E0D8] bg-[#FEFCE8] transition-all',
          collapsed ? 'justify-center p-3' : 'p-4',
        ].join(' ')}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#B8860B] text-[#1F1B16] text-xs font-black">
          ES
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-black tracking-wide text-[#1C1917]">EUROSTORE</p>
            <p className="text-xs text-[#A8A29E]">لوحة الإدارة</p>
          </div>
        )}
      </Link>

      <nav className="mt-5 space-y-5">
        {navGroups.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p className="mb-1.5 px-2 text-[10px] font-black uppercase tracking-widest text-[#A8A29E]">
                {group.title}
              </p>
            )}
            {collapsed && <div className="mx-auto my-3 h-px w-6 bg-[#E5E0D8]" />}
            <div className="space-y-0.5">
              {group.items.map(({ href, icon: Icon, label }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    title={label}
                    className={[
                      'flex items-center rounded-xl text-sm font-semibold transition-all',
                      collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
                      active
                        ? 'bg-[#B8860B] text-[#1F1B16] shadow-sm'
                        : 'text-[#57534E] hover:bg-[#F5F5F4] hover:text-[#1C1917]',
                    ].join(' ')}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <form action="/api/auth/logout" method="post" className="mt-6">
        <button
          type="submit"
          className={[
            'flex w-full items-center rounded-xl border border-[#E5E0D8] text-sm font-semibold text-[#57534E] transition hover:border-red-300 hover:bg-red-50 hover:text-red-600',
            collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
          ].join(' ')}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>تسجيل الخروج</span>}
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
    document.documentElement.style.setProperty('--admin-sidebar-space', saved ? '5rem' : '17rem');
  }, []);

  const toggle = () => {
    setCollapsed((v) => {
      const next = !v;
      window.localStorage.setItem('admin-sidebar-collapsed', next ? '1' : '0');
      document.documentElement.style.setProperty('--admin-sidebar-space', next ? '5rem' : '17rem');
      return next;
    });
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="fixed inset-y-0 right-0 z-40 hidden flex-col border-l border-[#E5E0D8] bg-white p-4 shadow-sm transition-[width] duration-300 md:flex overflow-y-auto"
        style={{ width: collapsed ? '5rem' : '17rem' }}
      >
        <button
          onClick={toggle}
          className="mb-3 flex h-9 w-full items-center justify-center rounded-xl border border-[#E5E0D8] bg-[#F8F6F2] text-[#A8A29E] transition hover:border-[#B8860B] hover:text-[#B8860B]"
          title={collapsed ? 'توسيع' : 'طي'}
        >
          {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <NavContent collapsed={collapsed} />
      </aside>

      {/* Mobile Top Bar */}
      <div className="sticky top-0 z-50 mb-4 border-b border-[#E5E0D8] bg-white px-4 py-3 shadow-sm md:hidden">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-lg border border-[#E5E0D8] p-2 text-[#57534E]"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <Link href="/" className="text-sm font-black tracking-widest text-[#B8860B]">
            EUROSTORE
          </Link>
        </div>
        {mobileOpen && (
          <div className="mt-3 max-h-[75vh] overflow-y-auto rounded-xl border border-[#E5E0D8] bg-white p-4">
            <NavContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </div>
        )}
      </div>
    </>
  );
}

export default Sidebar;