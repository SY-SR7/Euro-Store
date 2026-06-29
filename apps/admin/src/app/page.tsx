import Link from 'next/link';
import {
  Bookmark, FileText, Home, Package, Percent, RefreshCw,
  Settings, ShoppingCart, Star, Tag, Truck, UserCog, Users, TrendingUp
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { createAdminSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

type RevenueRow = { total_syp: number | string | null };

const statusLabels: Record<string, string> = {
  pending: 'قيد الانتظار', confirmed: 'تم التأكيد', processing: 'قيد المعالجة',
  shipped: 'تم الشحن', delivered: 'تم التوصيل', cancelled: 'ملغى',
};
const statusColors: Record<string, string> = {
  pending: 'badge-gold', confirmed: 'badge-blue', processing: 'badge-purple',
  shipped: 'badge-blue', delivered: 'badge-green', cancelled: 'badge-red',
};

const quickLinks = [
  { href: '/orders',          icon: ShoppingCart, label: 'الطلبات',              color: 'bg-blue-50 text-blue-700' },
  { href: '/products',        icon: Package,      label: 'المنتجات',             color: 'bg-amber-50 text-amber-700' },
  { href: '/customers',       icon: Users,        label: 'العملاء',              color: 'bg-green-50 text-green-700' },
  { href: '/exchanges',       icon: RefreshCw,    label: 'الاستبدال',            color: 'bg-purple-50 text-purple-700' },
  { href: '/categories',      icon: Tag,          label: 'التصنيفات',            color: 'bg-rose-50 text-rose-700' },
  { href: '/brands',          icon: Bookmark,     label: 'العلامات',             color: 'bg-indigo-50 text-indigo-700' },
  { href: '/homepage',        icon: Home,         label: 'الواجهة الرئيسية',     color: 'bg-teal-50 text-teal-700' },
  { href: '/discounts',       icon: Percent,      label: 'الخصومات',             color: 'bg-orange-50 text-orange-700' },
  { href: '/shipping-rates',  icon: Truck,        label: 'أسعار الشحن',          color: 'bg-sky-50 text-sky-700' },
  { href: '/loyalty-settings',icon: Star,         label: 'إعدادات الولاء',       color: 'bg-yellow-50 text-yellow-700' },
  { href: '/sub-admins',      icon: UserCog,      label: 'المسؤولون الفرعيون',   color: 'bg-slate-50 text-slate-700' },
  { href: '/settings',        icon: Settings,     label: 'الإعدادات',            color: 'bg-stone-50 text-stone-700' },
];

export default async function AdminRootPage() {
  const supabase = createAdminSupabaseClient();

  const [ordersRes, revenueRes, customersRes, productsRes, exchangesRes] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('total_syp').in('status', ['confirmed','processing','shipped','delivered']),
    supabase.from('customer_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('exchange_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]).catch(() => Array(5).fill({ data: [], count: 0, error: null }));

  const revenue = ((revenueRes.data ?? []) as RevenueRow[])
    .reduce((s, r) => s + (Number(r.total_syp) || 0), 0);

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, order_number, status, total_syp, created_at, address_snapshot')
    .order('created_at', { ascending: false })
    .limit(6)
    .catch(() => ({ data: [] }));

  const stats = [
    { label: 'إجمالي الطلبات',   value: (ordersRes.count ?? 0).toLocaleString('ar'), icon: ShoppingCart, href: '/orders',    color: 'text-blue-600',  bg: 'bg-blue-50' },
    { label: 'الإيرادات (ل.س)',  value: revenue.toLocaleString('ar'),               icon: TrendingUp,   href: '/orders',    color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'العملاء المسجّلون', value: (customersRes.count ?? 0).toLocaleString('ar'), icon: Users,    href: '/customers', color: 'text-purple-600',bg: 'bg-purple-50' },
    { label: 'المنتجات النشطة',  value: (productsRes.count ?? 0).toLocaleString('ar'), icon: Package,    href: '/products',  color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'طلبات استبدال معلّقة', value: (exchangesRes.count ?? 0).toLocaleString('ar'), icon: RefreshCw, href: '/exchanges', color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#1C1917]" dir="rtl">
      <Sidebar />
      <main className="admin-main min-h-screen px-4 py-6 transition-[padding] duration-300 md:pr-[var(--admin-sidebar-space,17rem)] md:pl-6">
        <div className="mx-auto max-w-5xl space-y-6">

          {/* Header */}
          <div className="rounded-2xl border border-[#E5E0D8] bg-white px-6 py-5 shadow-sm">
            <h1 className="text-2xl font-black text-[#1C1917]">لوحة التحكم</h1>
            <p className="mt-1 text-sm text-[#A8A29E]">مرحباً بك في إدارة EuroStore</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="group rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm transition hover:border-[#B8860B] hover:shadow-md"
              >
                <div className={`mb-3 inline-flex rounded-xl p-2 ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="mt-1 text-xs text-[#A8A29E]">{s.label}</p>
              </Link>
            ))}
          </div>

          {/* Quick Links */}
          <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-black uppercase tracking-wide text-[#A8A29E]">الوصول السريع</h2>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {quickLinks.map((q) => (
                <Link
                  key={q.href}
                  href={q.href}
                  className={`flex flex-col items-center gap-2 rounded-xl p-3 text-center transition hover:opacity-80 ${q.color} border border-transparent hover:border-current/20`}
                >
                  <q.icon className="h-5 w-5" />
                  <span className="text-xs font-semibold leading-tight">{q.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E5E0D8] px-5 py-4">
              <h2 className="font-black text-[#1C1917]">آخر الطلبات</h2>
              <Link href="/orders" className="text-sm font-semibold text-[#B8860B] hover:underline">عرض الكل</Link>
            </div>
            {(!recentOrders || recentOrders.length === 0) ? (
              <p className="p-8 text-center text-sm text-[#A8A29E]">لا توجد طلبات حتى الآن</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#F8F6F2]">
                    <tr>
                      <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-wide text-[#A8A29E]">رقم الطلب</th>
                      <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-wide text-[#A8A29E]">العميل</th>
                      <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-wide text-[#A8A29E]">الحالة</th>
                      <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-wide text-[#A8A29E]">الإجمالي</th>
                      <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wide text-[#A8A29E]">تفاصيل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0ECE6]">
                    {(recentOrders as any[]).map((o: any) => (
                      <tr key={o.id} className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="px-5 py-3 font-mono text-xs font-bold text-[#1C1917]">{o.order_number ?? '—'}</td>
                        <td className="px-5 py-3 text-[#57534E]">{o.address_snapshot?.full_name ?? '—'}</td>
                        <td className="px-5 py-3">
                          <span className={statusColors[o.status] ?? 'badge-gray'}>{statusLabels[o.status] ?? o.status}</span>
                        </td>
                        <td className="px-5 py-3 text-[#57534E]">{Number(o.total_syp || 0).toLocaleString('ar-SY')} ل.س</td>
                        <td className="px-5 py-3 text-left">
                          <Link href={`/orders/${o.id}`} className="font-bold text-[#B8860B] hover:underline">عرض</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}