import { requireAdminContext } from '@/supabase-server';
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';

interface RouteParams { params: { id: string } }

export async function PATCH(request: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (typeof body.value_ar === 'string') update.value_ar = body.value_ar;
  if (typeof body.value_en === 'string') update.value_en = body.value_en;
  if (typeof body.hex_color === 'string' || body.hex_color === null) update.hex_color = body.hex_color;
  if (typeof body.sort_order === 'number') update.sort_order = body.sort_order;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('attribute_values')
    .update(update as never)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error?.message || 'database_error' }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('attribute_values').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error?.message || 'database_error' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
