import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClientFromEnv, createSupabaseAdminClientFromEnv } from '@eurostore/database';

export async function GET() {
  const cookieStore = cookies();
  const supabase    = createSupabaseServerClientFromEnv(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createSupabaseAdminClientFromEnv();
  const { data } = await admin
    .from('exchange_requests')
    .select('id, order_id, customer_id, reason, status, created_at')
    .in('status', ['approved'])
    .order('created_at', { ascending: true })
    .limit(30);

  return NextResponse.json(data ?? []);
}
