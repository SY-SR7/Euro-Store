import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../supabase-server';
import { createInAppNotification, createSupabaseAdminClientFromEnv, notifyReferralRewardForOrder } from '@eurostore/database';
import { z } from 'zod';

const schema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'picked_up', 'shipped', 'delivered', 'rejected']),
  reason: z.string().min(2).optional(),
  rejection_reason: z.string().min(2).optional(),
  notes: z.string().optional(),
});

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'rejected'],
  confirmed: ['processing', 'rejected'],
  processing: ['picked_up', 'rejected'],
  picked_up: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  completed: [],
  cancelled: [],
  rejected: [],
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createSupabaseAdminClientFromEnv();
  const { data: helper } = await admin
    .from('helper_profiles')
    .select('id')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle();
  if (!helper) return NextResponse.json({ error: 'not_helper' }, { status: 403 });

  const body: unknown = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const rejectionReason = parsed.data.reason?.trim() ?? parsed.data.rejection_reason?.trim();
  if (parsed.data.status === 'rejected' && !rejectionReason) {
    return NextResponse.json({ error: 'reason_required' }, { status: 400 });
  }

  const { data: current, error: currentError } = await admin
    .from('orders')
    .select('id, order_number, customer_id, status, loyalty_points_used, loyalty_points_earned, discount_code_id, order_items(id, variant_id, bundle_id, quantity)')
    .eq('id', (await params).id)
    .single();
  if (currentError || !current) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const allowed = VALID_TRANSITIONS[String(current.status)] ?? [];
  if (parsed.data.status !== current.status && !allowed.includes(parsed.data.status)) {
    return NextResponse.json({ error: `Cannot transition from ${current.status} to ${parsed.data.status}` }, { status: 400 });
  }

  if (parsed.data.status === 'rejected') {
    const { data: terminated, error: terminationError } = await admin.rpc('terminate_order_atomic', {
      p_order_id: (await params).id,
      p_actor_id: user.id,
      p_actor_role: 'helper',
      p_target_status: 'rejected',
      p_reason: rejectionReason,
    });
    if (terminationError) {
      return NextResponse.json({ error: 'order_rejection_failed' }, { status: 400 });
    }
    if (current.customer_id) {
      await createInAppNotification(admin, {
        recipientId: current.customer_id,
        recipientRole: 'customer',
        type: 'order_update',
        titleAr: 'تم رفض الطلب',
        titleEn: 'Order rejected',
        bodyAr: `تم رفض طلبك ${current.order_number ?? current.id}.`,
        bodyEn: `Order ${current.order_number ?? current.id} was rejected.`,
        referenceId: current.id,
        referenceType: 'order',
        data: { status: 'rejected', reason: rejectionReason },
        sendEmail: true,
      });
    }
    return NextResponse.json(terminated);
  }

  if (parsed.data.status === current.status) return NextResponse.json(current);

  const { data: transitioned, error: transitionError } = await admin.rpc('transition_order_atomic', {
    p_order_id: (await params).id,
    p_actor_id: user.id,
    p_actor_role: 'helper',
    p_target_status: parsed.data.status,
    ...(parsed.data.notes ? { p_notes: parsed.data.notes } : {}),
  });
  if (transitionError || !transitioned) {
    return NextResponse.json({ error: 'order_transition_failed' }, { status: 400 });
  }

  if (current.customer_id) {
    await createInAppNotification(admin, {
      recipientId: current.customer_id,
      recipientRole: 'customer',
      type: 'order_update',
      titleAr: 'تحديث حالة الطلب',
      titleEn: 'Order status updated',
      bodyAr: `تم تحديث حالة طلبك ${current.order_number ?? current.id} إلى ${parsed.data.status}`,
      bodyEn: `Your order ${current.order_number ?? current.id} is now ${parsed.data.status}`,
      referenceId: current.id,
      referenceType: 'order',
      data: { status: transitioned.status },
      sendEmail: ['confirmed', 'shipped'].includes(parsed.data.status),
    });
    if (parsed.data.status === 'confirmed') {
      await notifyReferralRewardForOrder(admin, current.id, current.customer_id);
    }
    if (parsed.data.status === 'delivered') {
        await createInAppNotification(admin, {
          recipientId: current.customer_id,
          recipientRole: 'customer',
          type: 'order_update',
          titleAr: 'اكتمل الطلب',
          titleEn: 'Order completed',
          bodyAr: `تم اكتمال طلبك ${current.order_number ?? current.id}`,
          bodyEn: `Your order ${current.order_number ?? current.id} has been completed`,
          referenceId: current.id,
          referenceType: 'order',
          data: { status: 'completed' },
          sendEmail: true,
        });
    }
  }

  return NextResponse.json(transitioned);
}
