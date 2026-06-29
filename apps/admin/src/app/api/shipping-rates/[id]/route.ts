import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, requireAdminContext } from '@/supabase-server';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { admin } = ctx;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  const update: Record<string, unknown> = {};
  if (typeof body.base_rate_syp === 'number') update.base_rate_syp = body.base_rate_syp;
  if (typeof body.is_active === 'boolean') update.is_active = body.is_active;
  if (typeof body.free_shipping_threshold_syp === 'number' || body.free_shipping_threshold_syp === null) update.free_shipping_threshold_syp = body.free_shipping_threshold_syp;
  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
  const { data, error } = await admin.from('shipping_rates').update(update as never).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}