import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClientFromEnv, createSupabaseAdminClientFromEnv } from '@eurostore/database';

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const supabase    = createSupabaseServerClientFromEnv(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const admin  = createSupabaseAdminClientFromEnv();

  let query = admin
    .from('exchange_requests')
    .select('id, order_id, customer_id, reason, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (status) query = query.eq('status', status);

  const { data } = await query;
  return NextResponse.json(data ?? []);
}