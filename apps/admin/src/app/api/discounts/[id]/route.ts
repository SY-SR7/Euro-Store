// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { admin, userId } = ctx;
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;

  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

  const allowed = [
    'code',
    'type',
    'value',
    'min_order_syp',
    'valid_from',
    'valid_until',
    'max_uses',
    'used_count',
    'is_active',
  ];

  const update = Object.fromEntries(
    Object.entries(body)
      .filter(([key]) => allowed.includes(key))
      .map(([key, value]) => [key, key === 'code' && typeof value === 'string' ? value.trim().toUpperCase() : value])
  );

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data: before } = await admin
    .from('discount_codes')
    .select('*')
    .eq('id', params.id)
    .single();

  const { data, error } = await admin
    .from('discount_codes')
    .update(update as never)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    admin,
    actorId: userId,
    actorRole: 'admin',
    action: 'discount_update',
    entityType: 'discount_codes',
    entityId: params.id,
    beforeState: before as Record<string, unknown> | null,
    afterState: update,
  });

  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { admin, userId } = ctx;

  const { data: before } = await admin
    .from('discount_codes')
    .select('id, code, type, value')
    .eq('id', params.id)
    .single();

  const { error, count } = await admin
    .from('discount_codes')
    .delete({ count: 'exact' })
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if ((count ?? 0) === 0) {
    return NextResponse.json({ error: 'Discount not found or already deleted' }, { status: 404 });
  }

  await writeAuditLog({
    admin,
    actorId: userId,
    actorRole: 'admin',
    action: 'discount_delete',
    entityType: 'discount_codes',
    entityId: params.id,
    beforeState: before as Record<string, unknown> | null,
  });

  return NextResponse.json({ deleted: true });
}