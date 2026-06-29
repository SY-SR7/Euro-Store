import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/supabase-server';

export async function GET(req: NextRequest) {
  const admin = await requireAdminClient();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let query = admin
    .from('exchange_requests')
    .select('id,order_id,customer_id,reason_ar,reason_en,status,created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (status) query = query.eq('status', status as any);

  const { data } = await query;
  const mapped = (data ?? []).map(r => ({ ...r, reason: r.reason_ar }));
  return NextResponse.json(mapped);
}