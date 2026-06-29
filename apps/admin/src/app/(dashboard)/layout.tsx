'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useMemo, useState } from 'react';
import AdminActivityProvider from '../components/AdminActivityProvider';

type NavItem = {
  href: string;
  label: string;
  icon: string;
  group: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: '▦', group: 'الرئيسية' },
  { href: '/notifications', label: 'الإشعارات', icon: '🔔', group: 'الرئيسية' },

  { href: '/orders', label: 'الطلبات', icon: '🛒', group: 'المبيعات' },
  { href: '/exchanges', label: 'التبديلات', icon: '↔', group: 'المبيعات' },
  { href: '/customers', label: 'العملاء', icon: '👤', group: 'المبيعات' },

  { href: '/products', label: 'المنتجات', icon: '📦', group: 'الكتالوج' },
  { href: '/categories', label: 'التصنيفات', icon: '🗂', group: 'الكتالوج' },
  { href: '/brands', label: 'الماركات', icon: '🏷', group: 'الكتالوج' },
  { href: '/homepage', label: 'الواجهة الرئيسية', icon: '🏠', group: 'الكتالوج' },

  { href: '/discounts', label: 'الخصومات', icon: '%', group: 'التجارة' },
  { href: '/shipping-rates', label: 'أسعار الشحن', icon: '🚚', group: 'التجارة' },
  { href: '/loyalty-settings', label: 'الولاء', icon: '★', group: 'التجارة' },

  { href: '/sub-admins', label: 'المشرفون', icon: '🛡', group: 'النظام' },
  { href: '/audit-logs', label: 'سجل النشاط', icon: '🧾', group: 'النظام' },
  { href: '/settings', label: 'الإعدادات', icon: '⚙', group: 'النظام' },
];

const GROUPS = ['الرئيسية', 'المبيعات', 'الكتالوج', 'التجارة', 'النظام'];

function isActivePath(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/' || pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = isActivePath(pathname, item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={[
        'group flex h-[38px] items-center gap-2 rounded-xl border px-2.5 text-sm font-black transition-all',
        active
          ? 'border-[#B8860B] bg-[#B8860B] text-white shadow-sm'
          : 'border-transparent text-[#57534E] hover:border-[#E5E0D8] hover:bg-white hover:text-[#1C1917]',
      ].join(' ')}
    >
      <span
        className={[
          'grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[13px] transition',
          active
            ? 'bg-white/18 text-white'
            : 'bg-[#F8F6F2] text-[#A8A29E] group-hover:bg-[#FFF7DF] group-hover:text-[#B8860B]',
        ].join(' ')}
      >
        {item.icon}
      </span>

      <span className="min-w-0 flex-1 truncate">{item.label}</span>

      {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white" />}
    </Link>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
  mobile = false,
}: {
  pathname: string;
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  const groupedItems = useMemo(() => {
    return GROUPS.map((group) => ({
      group,
      items: NAV_ITEMS.filter((item) => item.group === group),
    })).filter((entry) => entry.items.length > 0);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#FDFBF7]">
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#E5E0D8] px-4">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-[#F8F6F2]"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 border-[#B8860B] bg-white text-base font-black text-[#B8860B] shadow-sm">
            E
          </span>

          <span className="min-w-0">
            <span className="block truncate text-base font-black tracking-tight text-[#1C1917]">EUROSTORE</span>
            <span className="block truncate text-[11px] font-bold text-[#A8A29E]">لوحة الإدارة</span>
          </span>
        </Link>

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

      <nav className="flex-1 px-3 py-3">
        <div className="space-y-3">
          {groupedItems.map((entry) => (
            <div key={entry.group}>
              <div className="mb-1.5 px-2 text-[10px] font-black uppercase tracking-wider text-[#A8A29E]">
                {entry.group}
              </div>

              <div className="space-y-1">
                {entry.items.map((item) => (
                  <SidebarLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="shrink-0 border-t border-[#E5E0D8] p-3">
        <div className="flex h-10 items-center gap-2 rounded-2xl border border-[#E5E0D8] bg-white px-3 shadow-sm">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-green-500" />
          <span className="min-w-0">
            <span className="block truncate text-[11px] font-black text-[#1C1917]">حالة لوحة الإدارة</span>
            <span className="block truncate text-[10px] font-bold text-green-700">متصلة وجاهزة</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/dashboard';
  const [mobileOpen, setMobileOpen] = useState(false);

  const title = useMemo(() => {
    return NAV_ITEMS.find((item) => isActivePath(pathname, item.href))?.label ?? 'لوحة الإدارة';
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#1C1917]" dir="rtl">
      <header className="fixed inset-x-0 top-0 z-[100] h-[72px] border-b border-[#E5E0D8] bg-[#FDFBF7]/95 shadow-sm backdrop-blur-xl">
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

            <div className="min-w-0">
              <h1 className="truncate text-base font-black text-[#1C1917] sm:text-lg">{title}</h1>
              <p className="mt-0.5 hidden text-xs font-medium text-[#A8A29E] sm:block">
                نافبار ثابت بالأعلى
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

      <aside className="fixed right-0 top-[72px] z-[90] hidden h-[calc(100vh-72px)] w-[282px] border-l border-[#E5E0D8] shadow-sm lg:block">
        <SidebarContent pathname={pathname} />
      </aside>

      <main className="min-h-screen pt-[92px] lg:pr-[282px]">
        <div className="mx-auto w-full max-w-[1920px] px-4 pb-8 sm:px-5 lg:px-6">
          <AdminActivityProvider>{children}</AdminActivityProvider>
        </div>
      </main>

      {mobileOpen && (
        <div className="fixed inset-0 z-[130] lg:hidden">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />

          <aside className="absolute right-0 top-0 h-full w-[min(90vw,23rem)] overflow-hidden border-l border-[#E5E0D8] bg-[#FDFBF7] shadow-2xl">
            <SidebarContent
              pathname={pathname}
              mobile
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}
    </div>
  );
}