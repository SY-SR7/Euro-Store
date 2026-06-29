// @ts-nocheck
import { NextResponse } from 'next/server';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { admin } = ctx;

  const { data, error } = await admin
    .from('orders')
    .select('*, order_items(id, variant_id, product_snapshot, quantity, unit_price_syp, total_price_syp)')
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { admin, userId } = ctx;
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  const nextStatus = typeof body.status === 'string' ? body.status : '';

  if (!VALID_STATUSES.includes(nextStatus)) {
    return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
  }

  const { data: current, error: currentError } = await admin
    .from('orders')
    .select('status')
    .eq('id', params.id)
    .single();

  if (currentError) return NextResponse.json({ error: currentError.message }, { status: 404 });

  const currentStatus = String(current?.status ?? '');
  const allowed = VALID_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(nextStatus)) {
    return NextResponse.json({ error: `Cannot transition from ${currentStatus} to ${nextStatus}` }, { status: 400 });
  }

  const update: Record<string, unknown> = { status: nextStatus };
  if (typeof body.notes === 'string') update.notes = body.notes;

  const { data, error } = await admin
    .from('orders')
    .update(update as never)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    admin,
    actorId: userId,
    actorRole: 'admin',
    action: `order_${nextStatus}`,
    entityType: 'orders',
    entityId: params.id,
    beforeState: { status: currentStatus },
    afterState: update,
  });

  return NextResponse.json(data);
}