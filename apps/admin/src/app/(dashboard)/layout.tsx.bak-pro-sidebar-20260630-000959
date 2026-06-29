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

  { href: '/discounts', label: 'الخصومات', icon: '%', group: 'الإعدادات' },
  { href: '/shipping-rates', label: 'الشحن', icon: '🚚', group: 'الإعدادات' },
  { href: '/loyalty-settings', label: 'الولاء', icon: '★', group: 'الإعدادات' },

  { href: '/sub-admins', label: 'المشرفون', icon: '🛡', group: 'النظام' },
  { href: '/audit-logs', label: 'سجل النشاط', icon: '🧾', group: 'النظام' },
  { href: '/settings', label: 'الإعدادات', icon: '⚙', group: 'النظام' },
];

const GROUPS = ['الرئيسية', 'المبيعات', 'الكتالوج', 'الإعدادات', 'النظام'];

function isActivePath(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/' || pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavButton({
  item,
  pathname,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  onClick?: () => void;
}) {
  const active = isActivePath(pathname, item.href);

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={[
        'inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl border px-3 text-sm font-black transition-all',
        active
          ? 'border-[#B8860B] bg-[#B8860B] text-white shadow-sm'
          : 'border-[#E5E0D8] bg-white text-[#57534E] hover:border-[#B8860B] hover:bg-[#FFF7DF] hover:text-[#1C1917]',
      ].join(' ')}
    >
      <span className="text-base leading-none">{item.icon}</span>
      <span className="whitespace-nowrap">{item.label}</span>
    </Link>
  );
}

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/dashboard';
  const [menuOpen, setMenuOpen] = useState(false);

  const title = useMemo(() => {
    return NAV_ITEMS.find((item) => isActivePath(pathname, item.href))?.label ?? 'لوحة الإدارة';
  }, [pathname]);

  const groupedItems = useMemo(() => {
    return GROUPS.map((group) => ({
      group,
      items: NAV_ITEMS.filter((item) => item.group === group),
    })).filter((entry) => entry.items.length > 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#1C1917]" dir="rtl">
      <header className="fixed inset-x-0 top-0 z-[100] border-b border-[#E5E0D8] bg-[#FDFBF7]/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] w-full max-w-[1920px] items-center gap-3 px-3 sm:px-5">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-[#F8F6F2]">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border-2 border-[#B8860B] bg-white text-lg font-black text-[#B8860B] shadow-sm">
              E
            </span>
            <span className="hidden sm:block">
              <span className="block text-base font-black tracking-tight text-[#1C1917]">EUROSTORE</span>
              <span className="block text-[11px] font-bold text-[#A8A29E]">لوحة الإدارة</span>
            </span>
          </Link>

          <div className="mx-1 hidden h-10 w-px shrink-0 bg-[#E5E0D8] lg:block" />

          <nav className="hidden min-w-0 flex-1 items-center gap-2 overflow-x-auto py-3 lg:flex">
            {NAV_ITEMS.map((item) => (
              <NavButton key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>

          <div className="min-w-0 flex-1 lg:hidden">
            <div className="truncate text-sm font-black text-[#1C1917]">{title}</div>
            <div className="mt-0.5 text-[11px] font-bold text-[#A8A29E]">نافبار ثابت بالأعلى</div>
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

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="grid h-11 w-11 place-items-center rounded-2xl border border-[#E5E0D8] bg-white text-xl text-[#57534E] shadow-sm transition hover:border-[#B8860B] hover:text-[#B8860B] lg:hidden"
              aria-label="فتح القائمة"
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto min-h-screen w-full max-w-[1920px] px-4 pb-8 pt-[92px] sm:px-5 lg:px-6">
        <AdminActivityProvider>{children}</AdminActivityProvider>
      </main>

      {menuOpen && (
        <div className="fixed inset-0 z-[120] lg:hidden">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />

          <aside className="absolute right-0 top-0 flex h-full w-[min(90vw,24rem)] flex-col border-l border-[#E5E0D8] bg-[#FDFBF7] shadow-2xl">
            <div className="flex h-[76px] items-center justify-between border-b border-[#E5E0D8] px-5">
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl border-2 border-[#B8860B] bg-white text-lg font-black text-[#B8860B]">
                  E
                </span>
                <span>
                  <span className="block text-base font-black text-[#1C1917]">EUROSTORE</span>
                  <span className="block text-[11px] font-bold text-[#A8A29E]">لوحة الإدارة</span>
                </span>
              </Link>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full bg-[#F8F6F2] text-xl text-[#57534E]"
                aria-label="إغلاق القائمة"
              >
                ×
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-5">
              <div className="space-y-6">
                {groupedItems.map((entry) => (
                  <div key={entry.group}>
                    <div className="mb-2 px-2 text-[11px] font-black uppercase tracking-wider text-[#A8A29E]">
                      {entry.group}
                    </div>

                    <div className="grid gap-2">
                      {entry.items.map((item) => {
                        const active = isActivePath(pathname, item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMenuOpen(false)}
                            className={[
                              'flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-black transition',
                              active
                                ? 'border-[#B8860B] bg-[#B8860B] text-white'
                                : 'border-[#E5E0D8] bg-white text-[#57534E] hover:border-[#B8860B] hover:bg-[#FFF7DF] hover:text-[#1C1917]',
                            ].join(' ')}
                          >
                            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/70 text-base">
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}