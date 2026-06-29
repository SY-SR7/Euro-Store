import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Bookmark,
  Boxes,
  Clock3,
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
import { createAdminSupabaseClient } from '@/supabase-server';

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

type VariantRow = {
  id: string;
  sku: string | null;
  stock_quantity: number | null;
  price_syp: number | string | null;
  products:
    | {
        name_ar?: string | null;
        name_en?: string | null;
        slug?: string | null;
      }
    | {
        name_ar?: string | null;
        name_en?: string | null;
        slug?: string | null;
      }[]
    | null;
};

type DashboardData = {
  stats: {
    orders: number;
    revenue: number;
    customers: number;
    products: number;
    activeProducts: number;
    variants: number;
    categories: number;
    brands: number;
    exchanges: number;
    shippingRates: number;
    homepageSections: number;
  };
  recentOrders: RecentOrder[];
  lowStock: VariantRow[];
  loaded: boolean;
};

const FALLBACK_DATA: DashboardData = {
  stats: {
    orders: 0,
    revenue: 0,
    customers: 0,
    products: 0,
    activeProducts: 0,
    variants: 0,
    categories: 0,
    brands: 0,
    exchanges: 0,
    shippingRates: 0,
    homepageSections: 0
  },
  recentOrders: [],
  lowStock: [],
  loaded: false
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

const statusLabels = {
  ar: {
    pending: 'قيد الانتظار',
    confirmed: 'تم التأكيد',
    processing: 'قيد المعالجة',
    shipped: 'تم الشحن',
    delivered: 'تم التوصيل',
    completed: 'مكتمل',
    cancelled: 'ملغى'
  },
  en: {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled'
  }
};

function asNumber(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SY' : 'en-US').format(value);
}

function formatSyp(value: number, locale: string) {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SY' : 'en-US', {
    style: 'currency',
    currency: 'SYP',
    maximumFractionDigits: 0
  }).format(value);
}

function productName(row: VariantRow, locale: string) {
  const product = Array.isArray(row.products) ? row.products[0] : row.products;
  return locale === 'ar'
    ? product?.name_ar ?? product?.name_en ?? '—'
    : product?.name_en ?? product?.name_ar ?? '—';
}

function orderStatusLabel(status: string | null, locale: string) {
  const key = (status ?? 'pending').toLowerCase();
  const dictionary = locale === 'ar' ? statusLabels.ar : statusLabels.en;
  return dictionary[key as keyof typeof dictionary] ?? status ?? '—';
}

async function loadDashboardData(): Promise<DashboardData> {
  try {
    const supabase = createAdminSupabaseClient();

    const [
      ordersCount,
      revenueRows,
      customersCount,
      productsCount,
      activeProductsCount,
      variantsCount,
      categoriesCount,
      brandsCount,
      pendingExchangesCount,
      shippingRatesCount,
      homepageSectionsCount,
      recentOrdersRows,
      lowStockRows
    ] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase
        .from('orders')
        .select('total_syp,status')
        .in('status', ['confirmed', 'processing', 'shipped', 'delivered', 'completed']),
      supabase.from('customer_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('product_variants').select('id', { count: 'exact', head: true }),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
      supabase.from('brands').select('id', { count: 'exact', head: true }),
      supabase.from('exchange_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('shipping_rates').select('id', { count: 'exact', head: true }),
      supabase.from('homepage_sections').select('id', { count: 'exact', head: true }),
      supabase
        .from('orders')
        .select('id, order_number, status, total_syp, created_at, address_snapshot')
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('product_variants')
        .select('id, sku, stock_quantity, price_syp, products(name_ar,name_en,slug)')
        .lte('stock_quantity', 5)
        .order('stock_quantity', { ascending: true })
        .limit(6)
    ]);

    const revenue = (revenueRows.data ?? []).reduce(
      (sum, row) => sum + asNumber(row.total_syp),
      0
    );

    return {
      stats: {
        orders: ordersCount.count ?? 0,
        revenue,
        customers: customersCount.count ?? 0,
        products: productsCount.count ?? 0,
        activeProducts: activeProductsCount.count ?? 0,
        variants: variantsCount.count ?? 0,
        categories: categoriesCount.count ?? 0,
        brands: brandsCount.count ?? 0,
        exchanges: pendingExchangesCount.count ?? 0,
        shippingRates: shippingRatesCount.count ?? 0,
        homepageSections: homepageSectionsCount.count ?? 0
      },
      recentOrders: (recentOrdersRows.data ?? []) as RecentOrder[],
      lowStock: (lowStockRows.data ?? []) as VariantRow[],
      loaded: true
    };
  } catch (error) {
    console.error('Admin dashboard load failed:', error);
    return FALLBACK_DATA;
  }
}

export default async function AdminDashboardPage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const data = await loadDashboardData();

  const mainStats = [
    {
      label: t('admin.totalOrders'),
      value: formatNumber(data.stats.orders, locale),
      href: '/orders',
      icon: ShoppingCart,
      hint: t('admin.manageOrders')
    },
    {
      label: t('admin.totalRevenue'),
      value: formatSyp(data.stats.revenue, locale),
      href: '/orders',
      icon: BarChart3,
      hint: t('admin.viewReports')
    },
    {
      label: t('admin.totalCustomers'),
      value: formatNumber(data.stats.customers, locale),
      href: '/customers',
      icon: Users,
      hint: t('admin.manageCustomers')
    },
    {
      label: t('admin.totalProducts'),
      value: formatNumber(data.stats.products, locale),
      href: '/products',
      icon: Package,
      hint: t('admin.manageProducts')
    },
    {
      label: t('admin.pendingExchanges'),
      value: formatNumber(data.stats.exchanges, locale),
      href: '/exchanges',
      icon: RefreshCw,
      hint: t('admin.exchanges')
    }
  ];

  const quickActions = [
    { title: t('admin.products'), value: data.stats.products, href: '/products', icon: Package },
    { title: t('admin.categories'), value: data.stats.categories, href: '/categories', icon: Tag },
    { title: t('admin.brands'), value: data.stats.brands, href: '/brands', icon: Bookmark },
    { title: t('admin.homepageSections'), value: data.stats.homepageSections, href: '/homepage', icon: Home },
    { title: t('admin.shippingRates'), value: data.stats.shippingRates, href: '/shipping-rates', icon: Truck },
    { title: t('admin.loyaltySettings'), value: data.stats.variants, href: '/loyalty-settings', icon: Star },
    { title: t('admin.subAdmins'), value: null, href: '/sub-admins', icon: UserCog },
    { title: t('admin.auditLogs'), value: null, href: '/audit-logs', icon: FileText },
    { title: t('admin.discounts'), value: null, href: '/discounts', icon: Percent },
    { title: t('admin.settings'), value: null, href: '/settings', icon: Settings }
  ];

  return (
    <div className="space-y-8 pb-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#191919] via-[#101010] to-[#050505] p-6 shadow-2xl">
        <div className="absolute -top-28 end-0 h-72 w-72 rounded-full bg-[#C9A84C]/20 blur-3xl" />
        <div className="absolute -bottom-32 start-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 py-2 text-xs font-black tracking-[0.24em] text-[#C9A84C]">
              <BadgeCheck className="h-4 w-4" />
              EUROSTORE ADMIN
            </div>

            <h1 className="mt-5 text-4xl font-black text-white sm:text-5xl">
              {t('admin.dashboardTitle')}
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#B8B1A4] sm:text-base">
              {t('admin.dashboardSubtitle')}
            </p>
          </div>

          <div className="grid min-w-[260px] grid-cols-2 gap-3 rounded-3xl border border-white/10 bg-black/25 p-4">
            <div>
              <div className="text-xs text-[#8E867A]">{t('admin.activeProducts')}</div>
              <div className="mt-1 text-2xl font-black text-white">
                {formatNumber(data.stats.activeProducts, locale)}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#8E867A]">{t('admin.variants')}</div>
              <div className="mt-1 text-2xl font-black text-white">
                {formatNumber(data.stats.variants, locale)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {!data.loaded ? (
        <section className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-100">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5" />
            <span>
              تعذر تحميل بيانات Supabase، لكن واجهة الأدمن أصبحت جاهزة. تحقق من مفاتيح البيئة أو من اتصال قاعدة البيانات.
            </span>
          </div>
        </section>
      ) : null}

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

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/10 bg-[#101010] p-5 shadow-2xl">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white">{t('admin.quickActions')}</h2>
              <p className="mt-1 text-sm text-[#8E867A]">{t('admin.healthSubtitle')}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
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
                          {action.value === null
                            ? t('admin.open')
                            : `${formatNumber(action.value, locale)} ${t('admin.items')}`}
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
              <h2 className="text-2xl font-black text-white">{t('admin.lowStock')}</h2>
              <p className="mt-1 text-sm text-[#8E867A]">{t('admin.inventory')}</p>
            </div>
            <Boxes className="h-6 w-6 text-[#C9A84C]" />
          </div>

          {data.lowStock.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-black/20 p-8 text-center text-sm text-[#8E867A]">
              {t('admin.noLowStock')}
            </div>
          ) : (
            <div className="space-y-3">
              {data.lowStock.map((row) => (
                <div key={row.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-black text-white">{productName(row, locale)}</div>
                      <div className="mt-1 text-xs text-[#8E867A]">
                        {t('admin.sku')}: {row.sku ?? '—'}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-sm font-black text-yellow-200">
                      {formatNumber(row.stock_quantity ?? 0, locale)}
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
            <h2 className="text-2xl font-black text-white">{t('admin.recentOrders')}</h2>
            <p className="mt-1 text-sm text-[#8E867A]">{t('admin.commerceManagement')}</p>
          </div>

          <Link href="/orders" className="inline-flex items-center gap-2 text-sm font-black text-[#C9A84C] hover:text-[#D9B95F]">
            {t('common.viewAll')}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {data.recentOrders.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-black/20 p-10 text-center">
            <Clock3 className="mx-auto h-8 w-8 text-[#C9A84C]" />
            <div className="mt-3 text-sm text-[#8E867A]">{t('admin.noRecentOrders')}</div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-[#C9A84C]">
                  <tr>
                    <th className="px-4 py-4 text-start font-black">#</th>
                    <th className="px-4 py-4 text-start font-black">{t('admin.customer')}</th>
                    <th className="px-4 py-4 text-start font-black">{t('admin.governorate')}</th>
                    <th className="px-4 py-4 text-start font-black">{t('admin.total')}</th>
                    <th className="px-4 py-4 text-start font-black">{t('admin.status')}</th>
                    <th className="px-4 py-4 text-start font-black">{t('admin.date')}</th>
                    <th className="px-4 py-4 text-end font-black">{t('common.actions')}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {data.recentOrders.map((order) => {
                    const status = (order.status ?? 'pending').toLowerCase();

                    return (
                      <tr key={order.id} className="text-[#EDE7DD] transition hover:bg-white/[0.03]">
                        <td className="px-4 py-4 font-black text-white">#{order.order_number ?? '—'}</td>
                        <td className="px-4 py-4">{order.address_snapshot?.full_name ?? t('common.noData')}</td>
                        <td className="px-4 py-4">{order.address_snapshot?.governorate ?? t('common.noData')}</td>
                        <td className="px-4 py-4">{formatSyp(asNumber(order.total_syp), locale)}</td>
                        <td className="px-4 py-4">
                          <span
                            className={[
                              'inline-flex rounded-full border px-3 py-1 text-xs font-black',
                              statusColors[status] ?? 'border-white/10 bg-white/5 text-white'
                            ].join(' ')}
                          >
                            {orderStatusLabel(status, locale)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {order.created_at
                            ? new Date(order.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SY' : 'en-US')
                            : '—'}
                        </td>
                        <td className="px-4 py-4 text-end">
                          <Link href={`/orders/${order.id}`} className="font-black text-[#C9A84C] hover:text-[#D9B95F]">
                            {t('admin.viewOrder')}
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
  );
}