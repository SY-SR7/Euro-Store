'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useMemo, useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import LanguageSwitcher from '../components/LanguageSwitcher';
import {
  Bell,
  ClipboardList,
  FolderTree,
  MessageSquareText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Palette,
  Percent,
  Repeat2,
  Settings,
  Shield,
  ShoppingBag,
  Star,
  Tags,
  Truck,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import AdminActivityProvider from '../components/AdminActivityProvider';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  group: string;
};

function getNavItems(t: any): NavItem[] {
  return [
    { href: '/dashboard', label: t('dashboard', { fallback: 'لوحة التحكم' }), icon: LayoutDashboard, group: t('groupMain', { fallback: 'الرئيسية' }) },
    { href: '/notifications', label: t('notifications', { fallback: 'الإشعارات' }), icon: Bell, group: t('groupMain', { fallback: 'الرئيسية' }) },

    { href: '/orders', label: t('orders', { fallback: 'الطلبات' }), icon: ShoppingBag, group: t('groupSales', { fallback: 'المبيعات' }) },
    { href: '/exchanges', label: t('exchanges', { fallback: 'طلبات الاستبدال' }), icon: Repeat2, group: t('groupSales', { fallback: 'المبيعات' }) },
    { href: '/customers', label: t('customers', { fallback: 'العملاء' }), icon: Users, group: t('groupSales', { fallback: 'المبيعات' }) },

    { href: '/products', label: t('products', { fallback: 'المنتجات' }), icon: Package, group: t('groupCatalog', { fallback: 'الكتالوج' }) },
    { href: '/categories', label: t('categories', { fallback: 'التصنيفات' }), icon: FolderTree, group: t('groupCatalog', { fallback: 'الكتالوج' }) },
    { href: '/brands', label: t('brands', { fallback: 'الماركات' }), icon: Tags, group: t('groupCatalog', { fallback: 'الكتالوج' }) },
    { href: '/homepage', label: t('homepage', { fallback: 'الواجهة الرئيسية' }), icon: Home, group: t('groupCatalog', { fallback: 'الكتالوج' }) },
    { href: '/attribute-types', label: t('attributeTypes', { fallback: 'الصفات (لون/مقاس)' }), icon: Palette, group: t('groupCatalog', { fallback: 'الكتالوج' }) },

    { href: '/discounts', label: t('discounts', { fallback: 'الخصومات' }), icon: Percent, group: t('groupCommerce', { fallback: 'التجارة' }) },
    { href: '/reviews', label: t('reviews', { fallback: 'تقييمات المنتجات' }), icon: MessageSquareText, group: t('groupCommerce', { fallback: 'التجارة' }) },
    { href: '/shipping-rates', label: t('shippingRates', { fallback: 'أسعار الشحن' }), icon: Truck, group: t('groupCommerce', { fallback: 'التجارة' }) },
    { href: '/loyalty-settings', label: t('loyaltySettings', { fallback: 'الولاء' }), icon: Star, group: t('groupCommerce', { fallback: 'التجارة' }) },

    { href: '/sub-admins', label: t('subAdmins', { fallback: 'المشرفون' }), icon: Shield, group: t('groupSystem', { fallback: 'النظام' }) },
    { href: '/audit-logs', label: t('auditLogs', { fallback: 'سجل النشاط' }), icon: ClipboardList, group: t('groupSystem', { fallback: 'النظام' }) },
    { href: '/settings', label: t('settings', { fallback: 'الإعدادات' }), icon: Settings, group: t('groupSystem', { fallback: 'النظام' }) },
  ];
}

function getGroups(t: any): string[] {
  return [
    t('groupMain', { fallback: 'الرئيسية' }),
    t('groupSales', { fallback: 'المبيعات' }),
    t('groupCatalog', { fallback: 'الكتالوج' }),
    t('groupCommerce', { fallback: 'التجارة' }),
    t('groupSystem', { fallback: 'النظام' })
  ];
}

function isActivePath(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/' || pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

async function tryLogoutRequest(path: string) {
  try {
    await fetch(path, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    // تجاهل الخطأ لأن بعض المشاريع لا تملك كل مسارات تسجيل الخروج
  }
}

function clearClientAuthData() {
  try {
    const localKeys = Object.keys(localStorage);
    for (const key of localKeys) {
      if (/auth|token|session|admin|user|supabase|jwt|email/i.test(key)) {
        localStorage.removeItem(key);
      }
    }

    const sessionKeys = Object.keys(sessionStorage);
    for (const key of sessionKeys) {
      if (/auth|token|session|admin|user|supabase|jwt|email/i.test(key)) {
        sessionStorage.removeItem(key);
      }
    }
  } catch {
    // storage may be blocked
  }

  try {
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0]?.trim();
      if (!name) return;

      if (/auth|token|session|admin|user|supabase|jwt|email/i.test(name)) {
        document.cookie = `${name}=; Max-Age=0; path=/`;
        document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
      }
    });
  } catch {
    // cookies may be unavailable
  }
}

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = isActivePath(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={[
        'relative flex h-8 items-center gap-2 rounded-lg px-2 text-[13px] font-bold transition',
        active
          ? 'bg-primary text-text-primary shadow-sm'
          : 'text-text-secondary hover:bg-[#F4EFE6] hover:text-text-primary',
      ].join(' ')}
    >
      <span className="grid w-5 shrink-0 place-items-center leading-none"><Icon size={14} /></span>
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-background-card" />}
    </Link>
  );
}

function LogoutButton({ compact = false }: { compact?: boolean }) {
  const [loading, setLoading] = useState(false);
  const t = useTranslations('auth');

  const handleLogout = async () => {
    setLoading(true);

    await Promise.all([
      tryLogoutRequest('/api/auth/logout'),
      tryLogoutRequest('/api/logout'),
      tryLogoutRequest('/api/admin/logout'),
    ]);

    clearClientAuthData();
    window.location.href = '/login';
  };

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={loading}
      className={[
        'flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 font-black text-red-700 transition hover:bg-red-100 disabled:opacity-60',
        compact ? 'h-10 px-3 text-xs' : 'h-9 w-full px-3 text-[12px]',
      ].join(' ')}
    >
      <LogOut size={14} />
      <span>{loading ? t('loggingOut', { fallback: 'جارٍ الخروج...' }) : t('logout', { fallback: 'تسجيل الخروج' })}</span>
    </button>
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
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const navItems = useMemo(() => getNavItems(t), [t]);
  const groups = useMemo(() => getGroups(t), [t]);

  const groupedItems = useMemo(() => {
    return groups.map((group) => ({
      group,
      items: navItems.filter((item) => item.group === group),
    })).filter((entry) => entry.items.length > 0);
  }, [navItems, groups]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#FBF8F1]">
      <div className="flex h-[64px] shrink-0 items-center justify-between border-b border-[#E7DDCC] px-4">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-2 rounded-xl px-1 py-1 transition hover:bg-[#F4EFE6]"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-primary bg-background-card text-sm font-black text-primary">
            E
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-black tracking-tight text-text-primary">EUROSTORE</span>
            <span className="block truncate text-[10px] font-bold text-text-muted">{t('adminPanel', { fallback: 'لوحة الإدارة' })}</span>
          </span>
        </Link>

        {mobile && (
          <button
            type="button"
            onClick={onNavigate}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F4EFE6] text-xl text-text-secondary"
            aria-label={tCommon('closeMenu', { fallback: 'إغلاق القائمة' })}
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <div className="space-y-2">
          {groupedItems.map((entry) => (
            <section key={entry.group}>
              <div className="mb-1 px-2 text-[9px] font-black tracking-wide text-text-muted">
                {entry.group}
              </div>

              <div className="space-y-0.5">
                {entry.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </nav>

      <div className="shrink-0 border-t border-[#E7DDCC] p-3">
        <LogoutButton />
      </div>
    </div>
  );
}

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/dashboard';
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isAr = locale === 'ar';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  const navItems = useMemo(() => getNavItems(t), [t]);

  const title = useMemo(() => {
    return navItems.find((item) => isActivePath(pathname, item.href))?.label ?? t('adminPanel', { fallback: 'لوحة الإدارة' });
  }, [pathname, navItems, t]);

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-text-primary" dir={isAr ? "rtl" : "ltr"}>
      <header className="fixed inset-x-0 top-0 z-[100] h-[64px] border-b border-[#E7DDCC] bg-[#FBF8F1]/95 shadow-sm backdrop-blur-xl">
        <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-5 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-[#E7DDCC] bg-background-card text-xl text-text-secondary shadow-sm transition hover:border-primary hover:text-primary lg:hidden"
              aria-label={tCommon('openSidebar', { fallback: 'فتح السايدبار' })}
            >
              <Menu size={19} />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-base font-black text-text-primary">{title}</h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/notifications"
              className={[
                'relative grid h-10 w-10 place-items-center rounded-xl border bg-background-card text-base shadow-sm transition',
                isActivePath(pathname, '/notifications')
                  ? 'border-primary text-primary'
                  : 'border-[#E7DDCC] text-text-secondary hover:border-primary hover:text-primary',
              ].join(' ')}
              aria-label={tCommon('notifications', { fallback: 'الإشعارات' })}
            >
              <Bell size={18} />
              <span className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
            </Link>

            <div className="hidden sm:flex items-center gap-2">
              <LanguageSwitcher />
              <LogoutButton compact />
            </div>
          </div>
        </div>
      </header>

      <aside className={`fixed ${isAr ? "right-0" : "left-0"} top-[64px] z-[90] hidden h-[calc(100vh-64px)] w-[250px] ${isAr ? "border-l" : "border-r"} border-[#E7DDCC] shadow-sm lg:block`}>
        <SidebarContent pathname={pathname} />
      </aside>

      <main className={`min-h-screen pt-[82px] ${isAr ? "lg:pr-[250px]" : "lg:pl-[250px]"}`}>
        <div className="mx-auto w-full max-w-[1920px] px-4 pb-8 sm:px-5 lg:px-6">
          <AdminActivityProvider>{children}</AdminActivityProvider>
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 h-[100dvh] z-[130] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          {/* Sidebar panel */}
          <aside
            className={`absolute ${
              isAr ? 'right-0 border-l' : 'left-0 border-r'
            } top-0 h-[100dvh] w-[min(86vw,20rem)] overflow-hidden border-[#E7DDCC] bg-[#FBF8F1] shadow-2xl`}
          >
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
