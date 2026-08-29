import { NextResponse } from 'next/server';
import { requireAdminContext } from '@/supabase-server';

export const dynamic = 'force-dynamic';

type RevenueRow = { total_syp: number|string|null };

export async function GET() {
  const ctx = await requireAdminContext('dashboard', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const admin = ctx.admin;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [ordersRes, revenueRes, dailyRevRes, weeklyRevRes, customersRes, productsRes, exchangesRes, settingsRes, lowStockRes] = await Promise.all([
      admin.from('orders').select('id', { count:'exact', head:true }),
      admin.from('orders').select('total_syp').in('status', ['confirmed','processing','shipped','delivered']),
      admin.from('orders').select('total_syp').gte('created_at', today).in('status', ['confirmed','processing','shipped','delivered']),
      admin.from('orders').select('total_syp').gte('created_at', lastWeek).in('status', ['confirmed','processing','shipped','delivered']),
      admin.from('customer_profiles').select('id', { count:'exact', head:true }),
      admin.from('products').select('id', { count:'exact', head:true }),
      admin.from('exchange_requests').select('id', { count:'exact', head:true }).eq('status', 'pending'),
      admin.from('system_settings').select('value').eq('key', 'usd_exchange_rate').maybeSingle(),
      admin.from('product_variants').select('id', { count:'exact', head:true }).lt('stock_quantity', 5),
    ]);

    const calculateTotal = (rows: RevenueRow[] | null) => (rows ?? []).reduce((sum, row) => sum + (Number(row.total_syp) || 0), 0);

    return NextResponse.json({
      orders:            ordersRes.count ?? 0,
      revenue_syp:       calculateTotal(revenueRes.data),
      daily_sales_syp:   calculateTotal(dailyRevRes.data),
      weekly_sales_syp:  calculateTotal(weeklyRevRes.data),
      customers:         customersRes.count ?? 0,
      products:          productsRes.count ?? 0,
      pending_exchanges: exchangesRes.count ?? 0,
      usd_rate:          parseFloat(settingsRes.data?.value || '15000'),
      low_stock_count:   lowStockRes.count ?? 0,
    });
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}
