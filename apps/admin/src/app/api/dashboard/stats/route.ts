import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase-server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createSupabaseAdminClientFromEnv();

    const [ordersRes, revenueRes, customersRes, exchangesRes] = await Promise.all([
      admin.from('orders').select('id', { count: 'exact', head: true }),
      admin.from('orders').select('total_syp').in('status', ['confirmed', 'processing', 'shipped', 'delivered', 'completed']),
      admin.from('customer_profiles').select('id', { count: 'exact', head: true }),
      admin.from('exchange_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    const totalRevenue = (revenueRes.data ?? []).reduce((sum, o) => sum + (Number(o.total_syp) || 0), 0);

    return NextResponse.json({
      total_orders    : ordersRes.count ?? 0,
      total_revenue_syp: totalRevenue,
      total_customers : customersRes.count ?? 0,
      pending_exchanges: exchangesRes.count ?? 0,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}