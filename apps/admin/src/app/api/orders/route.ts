import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase-server';

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const page   = Number(url.searchParams.get('page') ?? '1');
  const limit  = 20;
  const from   = (page - 1) * limit;

  let query = supabase
    .from('orders')
    .select('id, order_number, status, total_syp, created_at, address_snapshot, customer_id', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  if (status) query = // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query.eq('status', status as any);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, total: count });
}