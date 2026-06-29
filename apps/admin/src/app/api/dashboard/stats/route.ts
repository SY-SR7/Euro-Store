import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

type RevenueRow = { total_syp: number|string|null };

export async function GET() {
  try {
    const admin = createAdminSupabaseClient();
    const [ordersRes, revenueRes, customersRes, productsRes, exchangesRes] = await Promise.all([
      admin.from('orders').select('id', { count:'exact', head:true }),
      admin.from('orders').select('total_syp').in('status', ['confirmed','processing','shipped','delivered']),
      admin.from('customer_profiles').select('id', { count:'exact', head:true }),
      admin.from('products').select('id', { count:'exact', head:true }),
      admin.from('exchange_requests').select('id', { count:'exact', head:true }).eq('status', 'pending'),
    ]);
    const revenue = ((revenueRes.data ?? []) as RevenueRow[])
      .reduce((s, r) => s + (Number(r.total_syp) || 0), 0);
    return NextResponse.json({
      orders:            ordersRes.count ?? 0,
      revenue_syp:       revenue,
      customers:         customersRes.count ?? 0,
      products:          productsRes.count ?? 0,
      pending_exchanges: exchangesRes.count ?? 0,
    });
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}