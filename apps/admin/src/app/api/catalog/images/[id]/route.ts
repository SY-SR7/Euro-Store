import { requireAdminContext } from '@/supabase-server';
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';

interface RouteParams { params: { id: string }; }

export async function PATCH(request: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const admin = createAdminSupabaseClient();
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    // If setting as primary, unset others first
    if (body.is_primary && body.product_id) {
      await admin.from('product_images').update({ is_primary: false }).eq('product_id', body.product_id);
    }
    const update: Record<string, unknown> = {};
    if (typeof body.url === 'string') update.url = body.url.trim();
    if (typeof body.is_primary === 'boolean') update.is_primary = body.is_primary;
    if (typeof body.alt_ar === 'string') update.alt_ar = body.alt_ar;
    if (typeof body.sort_order === 'number') update.sort_order = body.sort_order;
    if (Object.keys(update).length === 0) return NextResponse.json({ ok: true });
    const { data, error } = await admin.from('product_images').update(update).eq('id', params.id).select().single();
    if (error) return NextResponse.json({ error: error?.message || 'database_error' }, { status: 500 });
    return NextResponse.json(data);
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const admin = createAdminSupabaseClient();
    const { error } = await admin.from('product_images').delete().eq('id', params.id);
    if (error) return NextResponse.json({ error: error?.message || 'database_error' }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}
