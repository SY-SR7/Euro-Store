'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useMemo, useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import LanguageSwitcher from '../components/LanguageSwitcher';
import {
  BarChart3,
  Bell,
  ClipboardList,
  FolderTree,
  Handshake,
  MessageSquareText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PackagePlus,
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
  Ruler,
  Layers3,
  PackageSearch,
  X,
  type LucideIcon,
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  group: string;
  module: string;
};

type Translator = (key: string, values?: Record<string, string>) => string;
type AdminAccess = { role: 'admin' | 'sub_admin'; permissions: Array<{ module: string }> };

function isAdminAccess(value: unknown): value is AdminAccess {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { role?: unknown; permissions?: unknown };
  return (candidate.role === 'admin' || candidate.role === 'sub_admin')
    && Array.isArray(candidate.permissions)
    && candidate.permissions.every((permission) => (
      typeof permission === 'object'
      && permission !== null
      && typeof (permission as { module?: unknown }).module === 'string'
    ));
}

function notificationCount(value: unknown): number {
  if (!value || typeof value !== 'object') return 0;
  const count = (value as { count?: unknown }).count;
  return typeof count === 'number' && Number.isFinite(count) ? Math.max(0, count) : 0;
}

function getNavItems(t: Translator): NavItem[] {
  return [
    { href: '/dashboard', label: t('dashboard', { fallback: 'لوحة التحكم' }), icon: LayoutDashboard, group: t('groupMain', { fallback: 'الرئيسية' }), module: 'dashboard' },
    { href: '/notifications', label: t('notifications', { fallback: 'الإشعارات' }), icon: Bell, group: t('groupMain', { fallback: 'الرئيسية' }), module: 'dashboard' },

    { href: '/orders', label: t('orders', { fallback: 'الطلبات' }), icon: ShoppingBag, group: t('groupSales', { fallback: 'المبيعات' }), module: 'order_management' },
    { href: '/exchanges', label: t('exchanges', { fallback: 'طلبات الاستبدال' }), icon: Repeat2, group: t('groupSales', { fallback: 'المبيعات' }), module: 'exchange_management' },
    { href: '/customers', label: t('customers', { fallback: 'العملاء' }), icon: Users, group: t('groupSales', { fallback: 'المبيعات' }), module: 'customer_management' },

    { href: '/products', label: t('products', { fallback: 'المنتجات' }), icon: Package, group: t('groupCatalog', { fallback: 'الكتالوج' }), module: 'product_management' },
    { href: '/categories', label: t('categories', { fallback: 'التصنيفات' }), icon: FolderTree, group: t('groupCatalog', { fallback: 'الكتالوج' }), module: 'category_management' },
    { href: '/collections', label: t('collections', { fallback: 'التشكيلات' }), icon: Layers3, group: t('groupCatalog', { fallback: 'الكتالوج' }), module: 'collection_management' },
    { href: '/bundles', label: t('bundles', { fallback: 'الحزم (Bundles)' }), icon: PackageSearch, group: t('groupCatalog', { fallback: 'الكتالوج' }), module: 'bundle_management' },
    { href: '/brands', label: t('brands', { fallback: 'الماركات' }), icon: Tags, group: t('groupCatalog', { fallback: 'الكتالوج' }), module: 'brand_management' },
    { href: '/homepage', label: t('homepage', { fallback: 'الواجهة الرئيسية' }), icon: Home, group: t('groupCatalog', { fallback: 'الكتالوج' }), module: 'homepage_management' },
    { href: '/attribute-types', label: t('attributeTypes', { fallback: 'الصفات (لون/مقاس)' }), icon: Palette, group: t('groupCatalog', { fallback: 'الكتالوج' }), module: 'product_management' },
    { href: '/size-guides', label: t('sizeGuides', { fallback: 'أدلة المقاسات' }), icon: Ruler, group: t('groupCatalog', { fallback: 'الكتالوج' }), module: 'product_management' },

    { href: '/discounts', label: t('discounts', { fallback: 'الخصومات' }), icon: Percent, group: t('groupCommerce', { fallback: 'التجارة' }), module: 'discount_code_management' },
    { href: '/reviews', label: t('reviews', { fallback: 'تقييمات المنتجات' }), icon: MessageSquareText, group: t('groupCommerce', { fallback: 'التجارة' }), module: 'product_management' },
    { href: '/shipping-rates', label: t('shippingRates', { fallback: 'أسعار الشحن' }), icon: Truck, group: t('groupCommerce', { fallback: 'التجارة' }), module: 'shipping_configuration' },
    { href: '/loyalty-settings', label: t('loyaltySettings', { fallback: 'الولاء' }), icon: Star, group: t('groupCommerce', { fallback: 'التجارة' }), module: 'loyalty_system_config' },

    { href: '/sub-admins',         label: t('subAdmins',       { fallback: 'المشرفون' }),          icon: Shield,       group: t('groupSystem', { fallback: 'النظام' }), module: 'sub_admins' },
    { href: '/helpers',            label: t('helpers',         { fallback: 'الموظفون (Helpers)'}),  icon: Shield,       group: t('groupSystem', { fallback: 'النظام' }), module: 'helper_management' },
    { href: '/partners',           label: t('partners',        { fallback: 'الشركاء (Partners)'}),  icon: Handshake,    group: t('groupSystem', { fallback: 'النظام' }), module: 'partner_management' },
    { href: '/audit-logs',         label: t('auditLogs',       { fallback: 'سجل النشاط' }),        icon: ClipboardList, group: t('groupSystem', { fallback: 'النظام' }), module: 'audit_log' },
    { href: '/reports',            label: t('reports',         { fallback: 'التقارير' }),           icon: BarChart3,    group: t('groupSystem', { fallback: 'النظام' }), module: 'reports' },
    { href: '/product-requests',   label: t('productRequests', { fallback: 'طلبات المنتجات' }),    icon: PackagePlus,  group: t('groupSystem', { fallback: 'النظام' }), module: 'helper_management' },
    { href: '/settings',           label: t('settings',        { fallback: 'الإعدادات' }),          icon: Settings,     group: t('groupSystem', { fallback: 'النظام' }), module: 'system_settings' },
  ];
}

function getGroups(t: Translator): string[] {
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
  allowedModules,
  onNavigate,
  mobile = false,
}: {
  pathname: string;
  allowedModules: ReadonlySet<string> | null;
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const navItems = useMemo(
    () => getNavItems(t).filter((item) => allowedModules === null || allowedModules.has(item.module)),
    [t, allowedModules],
  );
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
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isAr = locale === 'ar';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch('/api/admin/auth/me', { cache: 'no-store' });
        const payload: unknown = response.ok ? await response.json() : null;
        if (active) setAccess(isAdminAccess(payload) ? payload : null);
      } catch {
        if (active) setAccess(null);
      }
    })();
    return () => { active = false; };
  }, []);

  const allowedModules = useMemo<ReadonlySet<string> | null>(() => {
    if (access?.role === 'admin') return null;
    return new Set((access?.permissions ?? []).map((permission) => permission.module));
  }, [access]);

  useEffect(() => {
    if (allowedModules !== null && !allowedModules.has('dashboard')) {
      setUnreadNotifications(0);
      return;
    }

    let active = true;
    void (async () => {
      try {
        const response = await fetch('/api/notifications/unread-count', { cache: 'no-store' });
        const payload: unknown = response.ok ? await response.json() : null;
        if (active) setUnreadNotifications(notificationCount(payload));
      } catch {
        if (active) setUnreadNotifications(0);
      }
    })();
    return () => { active = false; };
  }, [pathname, allowedModules]);

  const navItems = useMemo(
    () => getNavItems(t).filter((item) => allowedModules === null || allowedModules.has(item.module)),
    [t, allowedModules],
  );

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
            {(allowedModules === null || allowedModules.has('dashboard')) && <Link
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
              {unreadNotifications > 0 ? <span className="absolute -left-2 -top-2 min-w-5 rounded-full border-2 border-white bg-red-500 px-1 text-center text-[10px] font-bold leading-4 text-white">{Math.min(unreadNotifications, 99)}</span> : null}
            </Link>}

            <div className="hidden sm:flex items-center gap-2">
              <LanguageSwitcher />
              <LogoutButton compact />
            </div>
          </div>
        </div>
      </header>

      <aside className={`fixed ${isAr ? "right-0" : "left-0"} top-[64px] z-[90] hidden h-[calc(100vh-64px)] w-[250px] ${isAr ? "border-l" : "border-r"} border-[#E7DDCC] shadow-sm lg:block`}>
        <SidebarContent pathname={pathname} allowedModules={allowedModules} />
      </aside>

      <main className={`min-h-screen pt-[82px] ${isAr ? "lg:pr-[250px]" : "lg:pl-[250px]"}`}>
        <div className="mx-auto w-full max-w-[1920px] px-4 pb-8 sm:px-5 lg:px-6">
          {children}
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
              allowedModules={allowedModules}
              mobile
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
