import { NextResponse } from 'next/server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';
import { createServerSupabaseClient } from '@/supabase-server';

type RevenueRow = {
  total_syp: number | string | null;
};

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createSupabaseAdminClientFromEnv();

    const [ordersRes, revenueRes, customersRes, productsRes, exchangesRes] = await Promise.all([
      admin.from('orders').select('id', { count: 'exact', head: true }),
      admin
        .from('orders')
        .select('total_syp')
        .in('status', ['confirmed', 'processing', 'shipped', 'delivered']),
      admin.from('customer_profiles').select('id', { count: 'exact', head: true }),
      admin.from('products').select('id', { count: 'exact', head: true }),
      admin.from('exchange_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')
    ]);

    const revenueRows = Array.isArray(revenueRes.data) ? (revenueRes.data as RevenueRow[]) : [];
    const totalRevenue = revenueRows.reduce((sum, row) => sum + (Number(row.total_syp) || 0), 0);

    return NextResponse.json({
      total_orders: ordersRes.count ?? 0,
      total_revenue_syp: totalRevenue,
      total_customers: customersRes.count ?? 0,
      total_products: productsRes.count ?? 0,
      pending_exchanges: exchangesRes.count ?? 0
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}