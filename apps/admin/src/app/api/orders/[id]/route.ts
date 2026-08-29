import { NextResponse } from 'next/server';
import { toJson, type TableUpdate } from '@/lib/database-types';
import { createInAppNotification, notifyReferralRewardForOrder } from '@eurostore/database';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled', 'rejected'],
  confirmed: ['processing', 'cancelled', 'rejected'],
  processing: ['picked_up', 'cancelled', 'rejected'],
  picked_up: ['shipped'],
  shipped: ['delivered'],
  delivered: ['completed'],
  completed: [],
  cancelled: [],
  rejected: [],
};

const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'picked_up', 'shipped', 'delivered', 'completed', 'cancelled', 'rejected'];
type PaymentStatus = NonNullable<TableUpdate<'orders'>['payment_status']>;
type PaymentMethod = NonNullable<TableUpdate<'orders'>['payment_method']>;

function isPaymentStatus(value: unknown): value is PaymentStatus {
  return typeof value === 'string' && ['pending', 'paid', 'failed', 'refunded'].includes(value);
}

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === 'string' && ['sham_cash', 'cash_on_delivery'].includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

type AdminClient = Awaited<ReturnType<typeof requireAdminContext>> extends infer Context
  ? Context extends { admin: infer Client } ? Client : never
  : never;

async function notifyCustomerOrderStatus(
  admin: AdminClient,
  order: { id: string; order_number?: string; customer_id?: string | null },
  status: string,
) {
  if (!order.customer_id) return;
  await createInAppNotification(admin, {
    recipientId: order.customer_id,
    recipientRole: 'customer',
    type: 'order_update',
    titleAr: 'تحديث حالة الطلب',
    titleEn: 'Order status updated',
    bodyAr: `تم تحديث حالة طلبك ${order.order_number ?? order.id} إلى ${status}`,
    bodyEn: `Your order ${order.order_number ?? order.id} is now ${status}`,
    referenceId: order.id,
    referenceType: 'order',
    data: { status },
    sendEmail: ['confirmed', 'shipped', 'completed', 'cancelled', 'rejected'].includes(status),
  });
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminContext('order_management', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
const { admin } = ctx;

  const { data, error } = await admin
    .from('orders')
    .select('*, order_items(id, variant_id, product_snapshot, quantity, unit_price_syp, total_price_syp)')
    .eq('id', (await params).id)
    .single();

  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminContext('order_management', 'edit');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
const { admin, userId } = ctx;
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  const { data: current, error: currentError } = await admin
    .from('orders')
    .select('id, order_number, customer_id, status, notes, payment_status, payment_method, address_snapshot, loyalty_points_used, loyalty_points_earned, discount_code_id, order_items(id, variant_id, bundle_id, quantity)')
    .eq('id', (await params).id)
    .single();

  if (currentError) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const currentStatus = String(current?.status ?? '');
  const update: TableUpdate<'orders'> = {};

  if (typeof body.status === 'string') {
    const nextStatus = body.status;
    if (!VALID_STATUSES.includes(nextStatus)) {
      return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
    }

    const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
    if (nextStatus !== currentStatus && !allowed.includes(nextStatus)) {
      return NextResponse.json({ error: `Cannot transition from ${currentStatus} to ${nextStatus}` }, { status: 400 });
    }
    if (nextStatus !== currentStatus && (nextStatus === 'cancelled' || nextStatus === 'rejected')) {
      const reason = typeof body.reason === 'string'
        ? body.reason.trim()
        : typeof body.rejection_reason === 'string'
          ? body.rejection_reason.trim()
          : typeof body.cancellation_reason === 'string'
            ? body.cancellation_reason.trim()
            : '';
      if (nextStatus === 'rejected' && reason.length < 3) {
        return NextResponse.json({ error: 'rejection_reason_required' }, { status: 400 });
      }
      const { data: terminated, error: terminationError } = await admin.rpc('terminate_order_atomic', {
        p_order_id: (await params).id,
        p_actor_id: userId,
        p_actor_role: ctx.role,
        p_target_status: nextStatus,
        ...(reason ? { p_reason: reason } : {}),
      });
      if (terminationError) {
        const refundRequired = terminationError.message.includes('refund_required');
        return NextResponse.json(
          { error: refundRequired ? 'refund_required' : 'order_termination_failed' },
          { status: refundRequired ? 409 : 400 },
        );
      }
      await notifyCustomerOrderStatus(admin, current, nextStatus);
      return NextResponse.json(terminated);
    }
    if (nextStatus !== currentStatus) {
      if (body.payment_status !== undefined || body.payment_method !== undefined || body.address_snapshot !== undefined) {
        return NextResponse.json({ error: 'status_update_must_be_separate' }, { status: 400 });
      }
      const { data: transitioned, error: transitionError } = await admin.rpc('transition_order_atomic', {
        p_order_id: (await params).id,
        p_actor_id: userId,
        p_actor_role: ctx.role,
        p_target_status: nextStatus,
        ...(typeof body.notes === 'string' ? { p_notes: body.notes } : {}),
      });
      if (transitionError || !transitioned) {
        return NextResponse.json({ error: 'order_transition_failed' }, { status: 400 });
      }
      await notifyCustomerOrderStatus(admin, transitioned, nextStatus);
      if (nextStatus === 'confirmed' && transitioned.customer_id) {
        await notifyReferralRewardForOrder(admin, transitioned.id, transitioned.customer_id);
      }
      if (nextStatus === 'delivered') await notifyCustomerOrderStatus(admin, transitioned, 'completed');
      return NextResponse.json(transitioned);
    }
  }

  if (body.payment_status !== undefined) {
    if (!isPaymentStatus(body.payment_status)) {
      return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 });
    }
    update.payment_status = body.payment_status;
  }

  if (body.payment_method !== undefined) {
    if (!isPaymentMethod(body.payment_method)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }
    update.payment_method = body.payment_method;
  }

  if (typeof body.notes === 'string' || body.notes === null) update.notes = body.notes;
  if (isRecord(body.address_snapshot)) {
    const currentAddress = isRecord(current?.address_snapshot) ? current.address_snapshot : {};
    update.address_snapshot = toJson({ ...currentAddress, ...body.address_snapshot });
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('orders')
    .update(update)
    .eq('id', (await params).id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  await writeAuditLog({
    admin,
    actorId: userId,
    actorRole: ctx.role,
    action: 'order_update',
    entityType: 'orders',
    entityId: (await params).id,
    beforeState: current as Record<string, unknown>,
    afterState: update,
  });

  return NextResponse.json(data);
}
