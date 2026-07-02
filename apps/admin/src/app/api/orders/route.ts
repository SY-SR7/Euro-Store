import { requireAdminContext } from '@/supabase-server';
﻿import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const page   = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
    const limit  = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));
    const status = searchParams.get('status') ?? '';
    const search = searchParams.get('search') ?? '';
    const offset = (page - 1) * limit;

    const supabase = createAdminSupabaseClient();

    let query = supabase
      .from('orders')
      .select('id, order_number, status, payment_status, payment_method, total_syp, created_at, address_snapshot, notes', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status as any);
    if (search) query = query.or(`order_number.ilike.%${search}%,address_snapshot->>full_name.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error?.message || 'database_error' }, { status: 500 });

    return NextResponse.json({ orders: data ?? [], total: count ?? 0, page, limit });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
