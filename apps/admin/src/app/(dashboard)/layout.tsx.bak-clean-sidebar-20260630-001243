'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import AdminActivityProvider from '../components/AdminActivityProvider';

type NavItem = {
  href: string;
  label: string;
  desc: string;
  icon: string;
  group: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'لوحة التحكم', desc: 'نظرة عامة', icon: '▦', group: 'الرئيسية' },
  { href: '/notifications', label: 'الإشعارات', desc: 'مركز التنبيهات', icon: '🔔', group: 'الرئيسية' },

  { href: '/orders', label: 'الطلبات', desc: 'إدارة الطلبات', icon: '🛒', group: 'المبيعات' },
  { href: '/exchanges', label: 'التبديلات', desc: 'طلبات الاستبدال', icon: '↔', group: 'المبيعات' },
  { href: '/customers', label: 'العملاء', desc: 'بيانات العملاء', icon: '👤', group: 'المبيعات' },

  { href: '/products', label: 'المنتجات', desc: 'المخزون والكتالوج', icon: '📦', group: 'الكتالوج' },
  { href: '/categories', label: 'التصنيفات', desc: 'أقسام المتجر', icon: '🗂', group: 'الكتالوج' },
  { href: '/brands', label: 'الماركات', desc: 'العلامات التجارية', icon: '🏷', group: 'الكتالوج' },
  { href: '/homepage', label: 'الواجهة الرئيسية', desc: 'محتوى الصفحة الرئيسية', icon: '🏠', group: 'الكتالوج' },

  { href: '/discounts', label: 'الخصومات', desc: 'كوبونات وعروض', icon: '%', group: 'التجارة' },
  { href: '/shipping-rates', label: 'أسعار الشحن', desc: 'الشحن حسب المحافظة', icon: '🚚', group: 'التجارة' },
  { href: '/loyalty-settings', label: 'الولاء', desc: 'نقاط ومكافآت', icon: '★', group: 'التجارة' },

  { href: '/sub-admins', label: 'المشرفون', desc: 'صلاحيات الفريق', icon: '🛡', group: 'النظام' },
  { href: '/audit-logs', label: 'سجل النشاط', desc: 'تتبع كل الحركات', icon: '🧾', group: 'النظام' },
  { href: '/settings', label: 'الإعدادات', desc: 'إعدادات عامة', icon: '⚙', group: 'النظام' },
];

const GROUPS = ['الرئيسية', 'المبيعات', 'الكتالوج', 'التجارة', 'النظام'];
const SIDEBAR_KEY = 'eurostore-admin-sidebar-collapsed-v2';

function isActivePath(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/' || pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarLink({
  item,
  pathname,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const active = isActivePath(pathname, item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={[
        'group relative flex items-center rounded-2xl border transition-all duration-200',
        collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-3',
        active
          ? 'border-[#B8860B] bg-[#FFF7DF] text-[#1C1917] shadow-sm'
          : 'border-transparent text-[#57534E] hover:border-[#E5E0D8] hover:bg-white hover:text-[#1C1917]',
      ].join(' ')}
    >
      <span
        className={[
          'grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-black transition-all duration-200',
          active
            ? 'bg-[#B8860B] text-white shadow-sm'
            : 'bg-[#F8F6F2] text-[#A8A29E] group-hover:bg-[#FFF7DF] group-hover:text-[#B8860B]',
        ].join(' ')}
      >
        {item.icon}
      </span>

      {!collapsed && (
        <>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-black">{item.label}</span>
            <span className="mt-0.5 block truncate text-[11px] font-medium text-[#A8A29E]">{item.desc}</span>
          </span>

          {active && <span className="h-2 w-2 shrink-0 rounded-full bg-[#B8860B]" />}
        </>
      )}

      {collapsed && active && (
        <span className="absolute left-1 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-[#B8860B]" />
      )}
    </Link>
  );
}

function SidebarContent({
  pathname,
  collapsed,
  onNavigate,
  onToggleCollapse,
  mobile = false,
}: {
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
  mobile?: boolean;
}) {
  const groupedItems = useMemo(() => {
    return GROUPS.map((group) => ({
      group,
      items: NAV_ITEMS.filter((item) => item.group === group),
    })).filter((entry) => entry.items.length > 0);
  }, []);

  return (
    <div className="flex h-full flex-col bg-[#FDFBF7]">
      <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-[#E5E0D8] px-4">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={[
            'flex items-center rounded-2xl transition hover:bg-[#F8F6F2]',
            collapsed && !mobile ? 'justify-center px-1 py-2' : 'gap-3 px-2 py-2',
          ].join(' ')}
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-[#B8860B] bg-white text-lg font-black text-[#B8860B] shadow-sm">
            E
          </span>

          {(!collapsed || mobile) && (
            <span className="min-w-0">
              <span className="block truncate text-base font-black tracking-tight text-[#1C1917]">EUROSTORE</span>
              <span className="block truncate text-[11px] font-bold text-[#A8A29E]">لوحة الإدارة</span>
            </span>
          )}
        </Link>

        {onToggleCollapse && !mobile && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[#E5E0D8] bg-white text-[#57534E] shadow-sm transition hover:border-[#B8860B] hover:text-[#B8860B]"
            aria-label={collapsed ? 'توسيع السايدبار' : 'طي السايدبار'}
            title={collapsed ? 'توسيع السايدبار' : 'طي السايدبار'}
          >
            {collapsed ? '›' : '‹'}
          </button>
        )}

        {mobile && (
          <button
            type="button"
            onClick={onNavigate}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F8F6F2] text-xl text-[#57534E]"
            aria-label="إغلاق القائمة"
          >
            ×
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-6">
          {groupedItems.map((entry) => (
            <div key={entry.group}>
              {(!collapsed || mobile) ? (
                <div className="mb-2 px-3 text-[11px] font-black uppercase tracking-wider text-[#A8A29E]">
                  {entry.group}
                </div>
              ) : (
                <div className="mx-auto mb-3 h-px w-10 rounded-full bg-[#E5E0D8]" />
              )}

              <div className="space-y-1.5">
                {entry.items.map((item) => (
                  <SidebarLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    collapsed={collapsed && !mobile}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="shrink-0 border-t border-[#E5E0D8] p-3">
        <div
          className={[
            'rounded-2xl border border-[#E5E0D8] bg-white shadow-sm',
            collapsed && !mobile ? 'p-2' : 'p-4',
          ].join(' ')}
        >
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-green-500" />
            {(!collapsed || mobile) && (
              <span>
                <span className="block text-xs font-black text-[#1C1917]">حالة لوحة الإدارة</span>
                <span className="mt-0.5 block text-[11px] font-bold text-green-700">متصلة وجاهزة</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/dashboard';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_KEY) === '1');
    } catch {
      setCollapsed(false);
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0');
      } catch {
        // ignore storage issues
      }
      return next;
    });
  };

  const title = useMemo(() => {
    return NAV_ITEMS.find((item) => isActivePath(pathname, item.href))?.label ?? 'لوحة الإدارة';
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#1C1917]" dir="rtl">
      <header className="fixed inset-x-0 top-0 z-[100] h-[76px] border-b border-[#E5E0D8] bg-[#FDFBF7]/95 shadow-sm backdrop-blur-xl">
        <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-5 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="grid h-11 w-11 place-items-center rounded-2xl border border-[#E5E0D8] bg-white text-xl text-[#57534E] shadow-sm transition hover:border-[#B8860B] hover:text-[#B8860B] lg:hidden"
              aria-label="فتح السايدبار"
            >
              ☰
            </button>

            <button
              type="button"
              onClick={toggleCollapsed}
              className="hidden h-11 w-11 place-items-center rounded-2xl border border-[#E5E0D8] bg-white text-lg text-[#57534E] shadow-sm transition hover:border-[#B8860B] hover:text-[#B8860B] lg:grid"
              aria-label={collapsed ? 'توسيع السايدبار' : 'طي السايدبار'}
              title={collapsed ? 'توسيع السايدبار' : 'طي السايدبار'}
            >
              {collapsed ? '☰' : '⇥'}
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-base font-black text-[#1C1917] sm:text-lg">{title}</h1>
              <p className="mt-0.5 hidden text-xs font-medium text-[#A8A29E] sm:block">
                نافبار ثابت بالأعلى + سايدبار احترافي ثابت
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/notifications"
              className={[
                'relative grid h-11 w-11 place-items-center rounded-2xl border bg-white text-lg shadow-sm transition',
                isActivePath(pathname, '/notifications')
                  ? 'border-[#B8860B] text-[#B8860B]'
                  : 'border-[#E5E0D8] text-[#57534E] hover:border-[#B8860B] hover:text-[#B8860B]',
              ].join(' ')}
              aria-label="الإشعارات"
            >
              🔔
              <span className="absolute -left-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-red-500" />
            </Link>

            <Link
              href="/settings"
              className="hidden rounded-2xl border border-[#E5E0D8] bg-white px-4 py-3 text-xs font-black text-[#57534E] shadow-sm transition hover:border-[#B8860B] hover:text-[#B8860B] sm:inline-flex"
            >
              الإعدادات
            </Link>
          </div>
        </div>
      </header>

      <aside
        className={[
          'fixed right-0 top-[76px] z-[90] hidden h-[calc(100vh-76px)] border-l border-[#E5E0D8] shadow-sm transition-all duration-300 lg:block',
          collapsed ? 'w-[92px]' : 'w-[292px]',
        ].join(' ')}
      >
        <SidebarContent
          pathname={pathname}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
        />
      </aside>

      <main
        className={[
          'min-h-screen pt-[96px] transition-all duration-300',
          collapsed ? 'lg:pr-[92px]' : 'lg:pr-[292px]',
        ].join(' ')}
      >
        <div className="mx-auto w-full max-w-[1920px] px-4 pb-8 sm:px-5 lg:px-6">
          <AdminActivityProvider>{children}</AdminActivityProvider>
        </div>
      </main>

      {mobileOpen && (
        <div className="fixed inset-0 z-[130] lg:hidden">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />

          <aside className="absolute right-0 top-0 h-full w-[min(90vw,24rem)] overflow-hidden border-l border-[#E5E0D8] bg-[#FDFBF7] shadow-2xl">
            <SidebarContent
              pathname={pathname}
              collapsed={false}
              mobile
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}
    </div>
  );
}