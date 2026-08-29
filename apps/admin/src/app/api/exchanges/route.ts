import { requireAdminContext } from '@/supabase-server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ctx = await requireAdminContext('exchange_management', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const admin = createAdminSupabaseClient();
    const { searchParams } = new URL(req.url);
    const status = z.enum(['pending', 'approved', 'rejected', 'item_received_by_shipping', 'completed']).safeParse(searchParams.get('status'));
    let query = admin
      .from('exchange_requests')
      .select('id,order_id,customer_id,reason_ar,reason_en,status,created_at,notes')
      .order('created_at', { ascending: false }).limit(100);
    if (status.success) query = query.eq('status', status.data);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
    const mapped = (data ?? []).map(r => ({ ...r, reason: r.reason_ar ?? r.reason_en ?? '' }));
    return NextResponse.json(mapped);
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}
