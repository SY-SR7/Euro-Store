import Link from 'next/link';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Bookmark,
  Boxes,
  FileText,
  Home,
  Package,
  Percent,
  RefreshCw,
  Settings,
  ShoppingCart,
  Star,
  Tag,
  Truck,
  UserCog,
  Users
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { createAdminSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

type CountStats = {
  orders: number;
  products: number;
  customers: number;
  revenue: number;
  exchanges: number;
  categories: number;
  brands: number;
  variants: number;
  shippingRates: number;
  homepageSections: number;
};

type RecentOrder = {
  id: string;
  order_number: string | null;
  status: string | null;
  total_syp: number | string | null;
  created_at: string | null;
  address_snapshot: {
    full_name?: string | null;
    governorate?: string | null;
  } | null;
};

type LowStockVariant = {
  id: string;
  sku: string | null;
  stock_quantity: number | null;
  price_syp: number | string | null;
};

const statusLabels: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'تم التأكيد',
  processing: 'قيد المعالجة',
  shipped: 'تم الشحن',
  delivered: 'تم التوصيل',
  completed: 'مكتمل',
  cancelled: 'ملغى'
};

const statusColors: Record<string, string> = {
  pending: 'border-yellow-400/20 bg-yellow-400/10 text-yellow-200',
  confirmed: 'border-blue-400/20 bg-blue-400/10 text-blue-200',
  processing: 'border-purple-400/20 bg-purple-400/10 text-purple-200',
  shipped: 'border-indigo-400/20 bg-indigo-400/10 text-indigo-200',
  delivered: 'border-green-400/20 bg-green-400/10 text-green-200',
  completed: 'border-green-400/20 bg-green-400/10 text-green-200',
  cancelled: 'border-red-400/20 bg-red-400/10 text-red-200'
};

function n(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function fmt(value: number) {
  return new Intl.NumberFormat('ar-SY').format(value);
}

function money(value: number) {
  return new Intl.NumberFormat('ar-SY', {
    style: 'currency',
    currency: 'SYP',
    maximumFractionDigits: 0
  }).format(value);
}

async function safeCount(supabase: ReturnType<typeof createAdminSupabaseClient>, table: string) {
  try {
    const { count } = await supabase.from(table).select('id', { count: 'exact', head: true });
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function safePendingExchangeCount(supabase: ReturnType<typeof createAdminSupabaseClient>) {
  try {
    const { count } = await supabase
      .from('exchange_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    return count ?? 0;
  } catch {
    return 0;
  }
}

async function safeRevenue(supabase: ReturnType<typeof createAdminSupabaseClient>) {
  try {
    const { data } = await supabase
      .from('orders')
      .select('total_syp,status')
      .in('status', ['confirmed', 'processing', 'shipped', 'delivered', 'completed'])
      .limit(1000);

    return (data ?? []).reduce((sum, row) => sum + n(row.total_syp), 0);
  } catch {
    return 0;
  }
}

async function safeRecentOrders(supabase: ReturnType<typeof createAdminSupabaseClient>) {
  try {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, status, total_syp, created_at, address_snapshot')
      .order('created_at', { ascending: false })
      .limit(6);

    return (data ?? []) as RecentOrder[];
  } catch {
    return [];
  }
}

async function safeLowStock(supabase: ReturnType<typeof createAdminSupabaseClient>) {
  try {
    const { data } = await supabase
      .from('product_variants')
      .select('id, sku, stock_quantity, price_syp')
      .lte('stock_quantity', 5)
      .order('stock_quantity', { ascending: true })
      .limit(6);

    return (data ?? []) as LowStockVariant[];
  } catch {
    return [];
  }
}

async function loadDashboard() {
  const supabase = createAdminSupabaseClient();

  const [
    orders,
    products,
    customers,
    revenue,
    exchanges,
    categories,
    brands,
    variants,
    shippingRates,
    homepageSections,
    recentOrders,
    lowStock
  ] = await Promise.all([
    safeCount(supabase, 'orders'),
    safeCount(supabase, 'products'),
    safeCount(supabase, 'customer_profiles'),
    safeRevenue(supabase),
    safePendingExchangeCount(supabase),
    safeCount(supabase, 'categories'),
    safeCount(supabase, 'brands'),
    safeCount(supabase, 'product_variants'),
    safeCount(supabase, 'shipping_rates'),
    safeCount(supabase, 'homepage_sections'),
    safeRecentOrders(supabase),
    safeLowStock(supabase)
  ]);

  const stats: CountStats = {
    orders,
    products,
    customers,
    revenue,
    exchanges,
    categories,
    brands,
    variants,
    shippingRates,
    homepageSections
  };

  return { stats, recentOrders, lowStock };
}

export default async function AdminHomePage() {
  const { stats, recentOrders, lowStock } = await loadDashboard();

  const mainStats = [
    {
      label: 'إجمالي الطلبات',
      value: fmt(stats.orders),
      href: '/orders',
      icon: ShoppingCart,
      hint: 'إدارة الطلبات وتحديث حالاتها'
    },
    {
      label: 'إجمالي الإيرادات',
      value: money(stats.revenue),
      href: '/orders',
      icon: BarChart3,
      hint: 'مجموع الطلبات المؤكدة والمكتملة'
    },
    {
      label: 'العملاء',
      value: fmt(stats.customers),
      href: '/customers',
      icon: Users,
      hint: 'ملفات العملاء ونقاط الولاء'
    },
    {
      label: 'المنتجات',
      value: fmt(stats.products),
      href: '/products',
      icon: Package,
      hint: `${fmt(stats.variants)} خيار / Variant`
    },
    {
      label: 'استبدالات معلقة',
      value: fmt(stats.exchanges),
      href: '/exchanges',
      icon: RefreshCw,
      hint: 'مراجعة طلبات الاستبدال'
    }
  ];

  const quickActions = [
    { title: 'المنتجات', value: stats.products, href: '/products', icon: Package },
    { title: 'التصنيفات', value: stats.categories, href: '/categories', icon: Tag },
    { title: 'العلامات التجارية', value: stats.brands, href: '/brands', icon: Bookmark },
    { title: 'أقسام الواجهة', value: stats.homepageSections, href: '/homepage', icon: Home },
    { title: 'أسعار الشحن', value: stats.shippingRates, href: '/shipping-rates', icon: Truck },
    { title: 'إعدادات الولاء', value: stats.variants, href: '/loyalty-settings', icon: Star },
    { title: 'الخصومات', value: null, href: '/discounts', icon: Percent },
    { title: 'المسؤولون الفرعيون', value: null, href: '/sub-admins', icon: UserCog },
    { title: 'سجل التدقيق', value: null, href: '/audit-logs', icon: FileText },
    { title: 'الإعدادات', value: null, href: '/settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#070707] text-[#F7F3EA]" dir="rtl">
      <Sidebar />

      <main className="min-h-screen px-4 py-5 md:pr-72 lg:px-8">
        <div className="mx-auto max-w-[1600px] space-y-8 pb-10">
          <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#191919] via-[#101010] to-[#050505] p-6 shadow-2xl">
            <div className="absolute -top-28 left-0 h-72 w-72 rounded-full bg-[#C9A84C]/20 blur-3xl" />
            <div className="absolute -bottom-32 right-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 py-2 text-xs font-black tracking-[0.24em] text-[#C9A84C]">
                  EUROSTORE ADMIN
                </div>

                <h1 className="mt-5 text-4xl font-black text-white sm:text-5xl">
                  لوحة التحكم
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-[#B8B1A4] sm:text-base">
                  مركز تشغيل متجر يورو: المنتجات، الطلبات، العملاء، الاستبدالات، الشحن، الولاء، والصلاحيات من مكان واحد.
                </p>
              </div>

              <div className="grid min-w-[280px] grid-cols-2 gap-3 rounded-3xl border border-white/10 bg-black/25 p-4">
                <div>
                  <div className="text-xs text-[#8E867A]">المنتجات</div>
                  <div className="mt-1 text-2xl font-black text-white">{fmt(stats.products)}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8E867A]">الخيارات</div>
                  <div className="mt-1 text-2xl font-black text-white">{fmt(stats.variants)}</div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {mainStats.map((card) => {
              const Icon = card.icon;

              return (
                <Link
                  key={card.label}
                  href={card.href}
                  className="group rounded-3xl border border-white/10 bg-[#121212] p-5 shadow-xl transition hover:-translate-y-1 hover:border-[#C9A84C]/50 hover:bg-[#171717]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="rounded-2xl bg-[#C9A84C]/10 p-3 text-[#C9A84C]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-[#777] transition group-hover:text-[#C9A84C]" />
                  </div>

                  <div className="mt-5 text-3xl font-black text-white">{card.value}</div>
                  <div className="mt-1 text-sm font-bold text-[#D8D1C5]">{card.label}</div>
                  <div className="mt-2 text-xs text-[#8E867A]">{card.hint}</div>
                </Link>
              );
            })}
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[2rem] border border-white/10 bg-[#101010] p-5 shadow-2xl">
              <div className="mb-5">
                <h2 className="text-2xl font-black text-white">إجراءات سريعة</h2>
                <p className="mt-1 text-sm text-[#8E867A]">روابط مباشرة لكل أقسام لوحة الإدارة.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="group rounded-3xl border border-white/10 bg-black/20 p-4 transition hover:border-[#C9A84C]/40 hover:bg-[#C9A84C]/10"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-2xl bg-white/5 p-3 text-[#C9A84C]">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-black text-white">{action.title}</div>
                            <div className="mt-1 text-xs text-[#8E867A]">
                              {action.value === null ? 'فتح القسم' : `${fmt(action.value)} عنصر`}
                            </div>
                          </div>
                        </div>

                        <ArrowUpRight className="h-4 w-4 text-[#777] transition group-hover:text-[#C9A84C]" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#101010] p-5 shadow-2xl">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white">مخزون منخفض</h2>
                  <p className="mt-1 text-sm text-[#8E867A]">خيارات وصلت إلى 5 قطع أو أقل.</p>
                </div>
                <Boxes className="h-6 w-6 text-[#C9A84C]" />
              </div>

              {lowStock.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-black/20 p-8 text-center text-sm text-[#8E867A]">
                  لا توجد عناصر منخفضة المخزون حالياً.
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStock.map((row) => (
                    <div key={row.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-black text-white">{row.sku ?? 'Variant'}</div>
                          <div className="mt-1 text-xs text-[#8E867A]">
                            السعر: {money(n(row.price_syp))}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-sm font-black text-yellow-200">
                          {fmt(row.stock_quantity ?? 0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[#101010] p-5 shadow-2xl">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-black text-white">آخر الطلبات</h2>
                <p className="mt-1 text-sm text-[#8E867A]">أحدث الطلبات المسجلة في المتجر.</p>
              </div>

              <Link href="/orders" className="inline-flex items-center gap-2 text-sm font-black text-[#C9A84C] hover:text-[#D9B95F]">
                عرض الكل
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-black/20 p-10 text-center">
                <AlertTriangle className="mx-auto h-8 w-8 text-[#C9A84C]" />
                <div className="mt-3 text-sm text-[#8E867A]">
                  لا توجد طلبات حديثة بعد.
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-white/10">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-white/5 text-[#C9A84C]">
                      <tr>
                        <th className="px-4 py-4 text-right font-black">#</th>
                        <th className="px-4 py-4 text-right font-black">العميل</th>
                        <th className="px-4 py-4 text-right font-black">المحافظة</th>
                        <th className="px-4 py-4 text-right font-black">الإجمالي</th>
                        <th className="px-4 py-4 text-right font-black">الحالة</th>
                        <th className="px-4 py-4 text-right font-black">التاريخ</th>
                        <th className="px-4 py-4 text-left font-black">الإجراء</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-white/10">
                      {recentOrders.map((order) => {
                        const status = (order.status ?? 'pending').toLowerCase();

                        return (
                          <tr key={order.id} className="text-[#EDE7DD] transition hover:bg-white/[0.03]">
                            <td className="px-4 py-4 font-black text-white">#{order.order_number ?? '—'}</td>
                            <td className="px-4 py-4">{order.address_snapshot?.full_name ?? '—'}</td>
                            <td className="px-4 py-4">{order.address_snapshot?.governorate ?? '—'}</td>
                            <td className="px-4 py-4">{money(n(order.total_syp))}</td>
                            <td className="px-4 py-4">
                              <span
                                className={[
                                  'inline-flex rounded-full border px-3 py-1 text-xs font-black',
                                  statusColors[status] ?? 'border-white/10 bg-white/5 text-white'
                                ].join(' ')}
                              >
                                {statusLabels[status] ?? order.status ?? '—'}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              {order.created_at
                                ? new Date(order.created_at).toLocaleDateString('ar-SY')
                                : '—'}
                            </td>
                            <td className="px-4 py-4 text-left">
                              <Link href={`/orders/${order.id}`} className="font-black text-[#C9A84C] hover:text-[#D9B95F]">
                                تفاصيل
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}