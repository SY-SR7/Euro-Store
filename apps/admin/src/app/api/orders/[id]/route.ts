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
const VALID_PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
const VALID_PAYMENT_METHODS = ['sham_cash', 'cash_on_delivery'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
const { admin } = ctx;

  const { data, error } = await admin
    .from('orders')
    .select('*, order_items(id, variant_id, product_snapshot, quantity, unit_price_syp, total_price_syp)')
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
const { admin, userId } = ctx;
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  const { data: current, error: currentError } = await admin
    .from('orders')
    .select('status, notes, payment_status, payment_method, address_snapshot')
    .eq('id', params.id)
    .single();

  if (currentError) return NextResponse.json({ error: currentError.message }, { status: 404 });

  const currentStatus = String(current?.status ?? '');
  const update: Record<string, unknown> = {};

  if (typeof body.status === 'string') {
    const nextStatus = body.status;
    if (!VALID_STATUSES.includes(nextStatus)) {
      return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
    }

    const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
    if (nextStatus !== currentStatus && !allowed.includes(nextStatus)) {
      return NextResponse.json({ error: `Cannot transition from ${currentStatus} to ${nextStatus}` }, { status: 400 });
    }
    update.status = nextStatus;
  }

  if (typeof body.payment_status === 'string') {
    if (!VALID_PAYMENT_STATUSES.includes(body.payment_status)) {
      return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 });
    }
    update.payment_status = body.payment_status;
  }

  if (typeof body.payment_method === 'string') {
    if (!VALID_PAYMENT_METHODS.includes(body.payment_method)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }
    update.payment_method = body.payment_method;
  }

  if (typeof body.notes === 'string' || body.notes === null) update.notes = body.notes;

  if (isRecord(body.address_snapshot)) {
    const currentAddress = isRecord(current?.address_snapshot) ? current.address_snapshot : {};
    update.address_snapshot = { ...currentAddress, ...body.address_snapshot };
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('orders')
    .update(update as never)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

  await writeAuditLog({
    admin,
    actorId: userId,
    actorRole: 'admin',
    action: update.status ? `order_${String(update.status)}` : 'order_update',
    entityType: 'orders',
    entityId: params.id,
    beforeState: current as Record<string, unknown>,
    afterState: update,
  });

  return NextResponse.json(data);
}
