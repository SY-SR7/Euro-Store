import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, requireAdminContext } from '@/supabase-server';

interface RouteParams { params: { id: string } }

export async function GET(_req: Request, { params }: RouteParams) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from('discount_codes').select('*').eq('id', params.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { admin } = ctx;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  const update: Record<string, unknown> = {};
  if (typeof body.value === 'number') update.value = body.value;
  if (typeof body.is_active === 'boolean') update.is_active = body.is_active;
  if (typeof body.min_order_syp === 'number' || body.min_order_syp === null) update.min_order_syp = body.min_order_syp;
  if (typeof body.max_uses === 'number' || body.max_uses === null) update.max_uses = body.max_uses;
  if (typeof body.valid_from === 'string') update.valid_from = body.valid_from;
  if (typeof body.valid_until === 'string') update.valid_until = body.valid_until;
  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
  const { data, error } = await admin.from('discount_codes').update(update as never).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { admin } = ctx;
  const { error } = await admin.from('discount_codes').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}