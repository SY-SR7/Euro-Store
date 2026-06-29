import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase-server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const admin  = createSupabaseAdminClientFromEnv();

  let query = admin
    .from('exchange_requests')
    .select('id, order_id, customer_id, reason_ar, reason_en, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (status) query = // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query.eq('status', status as any);

  const { data } = await query;

  // Map to shape frontend expects
  const mapped = (data ?? []).map((r) => ({
    ...r,
    reason: r.reason_ar, // fallback for any legacy frontend ref
  }));

  return NextResponse.json(mapped);
}
