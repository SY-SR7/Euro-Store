import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from('exchange_requests')
      .select('id,order_id,customer_id,reason_ar,reason_en,status,created_at,notes')
      .eq('id', params.id)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = createAdminSupabaseClient();
    const body = await req.json() as { status?: string; notes?: string };
    const update: Record<string, unknown> = {};
    if (body.status) update.status = body.status;
    if (body.notes !== undefined) update.notes = body.notes;

    const { data, error } = await admin
      .from('exchange_requests')
      .update(update as never)
      .eq('id', params.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}