import { requireAdminContext } from '@/supabase-server';
﻿import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const admin = createAdminSupabaseClient();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    let query = admin
      .from('exchange_requests')
      .select('id,order_id,customer_id,reason_ar,reason_en,status,created_at,notes')
      .order('created_at', { ascending: false }).limit(100);
    if (status) query = query.eq('status', status as any);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error?.message || 'database_error' }, { status: 500 });
    const mapped = (data ?? []).map(r => ({ ...r, reason: r.reason_ar ?? r.reason_en ?? '' }));
    return NextResponse.json(mapped);
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}