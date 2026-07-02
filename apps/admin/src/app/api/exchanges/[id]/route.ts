import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient, requireAdminContext } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from('exchange_requests').select('*').eq('id', params.id).single();
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 404 });
  return NextResponse.json({ ...data, reason: data.reason_ar ?? data.reason_en ?? '' });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
const { admin } = ctx;
  const body = await req.json().catch(() => ({})) as {
    status?: string;
    notes?: string;
    reason_ar?: string;
    reason_en?: string;
  };
  const update: Record<string, unknown> = {};
  if (body.status) update.status = body.status;
  if (body.notes !== undefined) update.notes = body.notes;
  if (body.reason_ar !== undefined) update.reason_ar = body.reason_ar;
  if (body.reason_en !== undefined) update.reason_en = body.reason_en;
  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'No fields' }, { status: 400 });
  const { data, error } = await admin.from('exchange_requests').update(update as never).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json({ ...data, reason: data.reason_ar ?? data.reason_en ?? '' });
}
