'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useMemo, useState } from 'react';
import {
  Bell,
  ClipboardList,
  FolderTree,
  MessageSquareText,
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

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, group: 'الرئيسية' },
  { href: '/notifications', label: 'الإشعارات', icon: Bell, group: 'الرئيسية' },

  { href: '/orders', label: 'الطلبات', icon: ShoppingBag, group: 'المبيعات' },
  { href: '/exchanges', label: 'طلبات الاستبدال', icon: Repeat2, group: 'المبيعات' },
  { href: '/customers', label: 'العملاء', icon: Users, group: 'المبيعات' },

  { href: '/products', label: 'المنتجات', icon: Package, group: 'الكتالوج' },
  { href: '/categories', label: 'التصنيفات', icon: FolderTree, group: 'الكتالوج' },
  { href: '/brands', label: 'الماركات', icon: Tags, group: 'الكتالوج' },
  { href: '/homepage', label: 'الواجهة الرئيسية', icon: Home, group: 'الكتالوج' },
  { href: '/attribute-types', label: 'الصفات (لون/مقاس)', icon: Palette, group: 'الكتالوج' },

  { href: '/discounts', label: 'الخصومات', icon: Percent, group: 'التجارة' },
  { href: '/reviews', label: 'تقييمات المنتجات', icon: MessageSquareText, group: 'التجارة' },
  { href: '/reviews', label: 'تقييمات المنتجات', icon: MessageSquareText, group: 'التجارة' },
  { href: '/shipping-rates', label: 'أسعار الشحن', icon: Truck, group: 'التجارة' },
  { href: '/loyalty-settings', label: 'الولاء', icon: Star, group: 'التجارة' },

  { href: '/sub-admins', label: 'المشرفون', icon: Shield, group: 'النظام' },
  { href: '/audit-logs', label: 'سجل النشاط', icon: ClipboardList, group: 'النظام' },
  { href: '/settings', label: 'الإعدادات', icon: Settings, group: 'النظام' },
];

const GROUPS = ['الرئيسية', 'المبيعات', 'الكتالوج', 'التجارة', 'النظام'];

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
          ? 'bg-[#B8860B] text-white shadow-sm'
          : 'text-[#57534E] hover:bg-[#F4EFE6] hover:text-[#1C1917]',
      ].join(' ')}
    >
      <span className="grid w-5 shrink-0 place-items-center leading-none"><Icon size={14} /></span>
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white" />}
    </Link>
  );
}

function LogoutButton({ compact = false }: { compact?: boolean }) {
  const [loading, setLoading] = useState(false);

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
      <span>{loading ? 'جارٍ الخروج...' : 'تسجيل الخروج'}</span>
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
  const groupedItems = useMemo(() => {
    return GROUPS.map((group) => ({
      group,
      items: NAV_ITEMS.filter((item) => item.group === group),
    })).filter((entry) => entry.items.length > 0);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#FBF8F1]">
      <div className="flex h-[64px] shrink-0 items-center justify-between border-b border-[#E7DDCC] px-4">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-2 rounded-xl px-1 py-1 transition hover:bg-[#F4EFE6]"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#B8860B] bg-white text-sm font-black text-[#B8860B]">
            E
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-black tracking-tight text-[#1C1917]">EUROSTORE</span>
            <span className="block truncate text-[10px] font-bold text-[#A8A29E]">لوحة الإدارة</span>
          </span>
        </Link>

        {mobile && (
          <button
            type="button"
            onClick={onNavigate}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F4EFE6] text-xl text-[#57534E]"
            aria-label="إغلاق القائمة"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-2">
        <div className="space-y-2">
          {groupedItems.map((entry) => (
            <section key={entry.group}>
              <div className="mb-1 px-2 text-[9px] font-black tracking-wide text-[#A8A29E]">
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

  const title = useMemo(() => {
    return NAV_ITEMS.find((item) => isActivePath(pathname, item.href))?.label ?? 'لوحة الإدارة';
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#1C1917]" dir="rtl">
      <header className="fixed inset-x-0 top-0 z-[100] h-[64px] border-b border-[#E7DDCC] bg-[#FBF8F1]/95 shadow-sm backdrop-blur-xl">
        <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-5 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-[#E7DDCC] bg-white text-xl text-[#57534E] shadow-sm transition hover:border-[#B8860B] hover:text-[#B8860B] lg:hidden"
              aria-label="فتح السايدبار"
            >
              <Menu size={19} />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-base font-black text-[#1C1917]">{title}</h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/notifications"
              className={[
                'relative grid h-10 w-10 place-items-center rounded-xl border bg-white text-base shadow-sm transition',
                isActivePath(pathname, '/notifications')
                  ? 'border-[#B8860B] text-[#B8860B]'
                  : 'border-[#E7DDCC] text-[#57534E] hover:border-[#B8860B] hover:text-[#B8860B]',
              ].join(' ')}
              aria-label="الإشعارات"
            >
              <Bell size={18} />
              <span className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
            </Link>

            <div className="hidden sm:block">
              <LogoutButton compact />
            </div>
          </div>
        </div>
      </header>

      <aside className="fixed right-0 top-[64px] z-[90] hidden h-[calc(100vh-64px)] w-[250px] border-l border-[#E7DDCC] shadow-sm lg:block">
        <SidebarContent pathname={pathname} />
      </aside>

      <main className="min-h-screen pt-[82px] lg:pr-[250px]">
        <div className="mx-auto w-full max-w-[1920px] px-4 pb-8 sm:px-5 lg:px-6">
          <AdminActivityProvider>{children}</AdminActivityProvider>
        </div>
      </main>

      {mobileOpen && (
        <div className="fixed inset-0 z-[130] lg:hidden">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />

          <aside className="absolute right-0 top-0 h-full w-[min(86vw,20rem)] overflow-hidden border-l border-[#E7DDCC] bg-[#FBF8F1] shadow-2xl">
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
