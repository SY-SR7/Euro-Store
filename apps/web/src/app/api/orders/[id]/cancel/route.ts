import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { createInAppNotification } from '@eurostore/database';
import { createAdminSupabaseClient, getSessionClient } from '@/supabase-server';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await getSessionClient();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const admin = createAdminSupabaseClient();
    const query = admin.from('orders').select('id, order_number, customer_id, status')
      .eq('customer_id', user.id);
    const { data: order, error: loadError } = await (
      uuidPattern.test((await params).id) ? query.eq('id', (await params).id) : query.eq('order_number', (await params).id)
    ).maybeSingle();
    if (loadError) return NextResponse.json({ error: 'database_error' }, { status: 500 });
    if (!order) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const { data: updated, error } = await admin.rpc('terminate_order_atomic', {
      p_order_id: order.id,
      p_actor_id: user.id,
      p_actor_role: 'customer',
      p_target_status: 'cancelled',
      p_reason: 'customer_cancelled_pending_order',
    });
    if (error) {
      const forbidden = error.message.includes('forbidden_order_transition');
      return NextResponse.json(
        { error: forbidden ? 'cannot_cancel_after_pending' : 'cancellation_failed' },
        { status: forbidden ? 409 : 500 },
      );
    }

    await createInAppNotification(admin, {
      recipientId: user.id,
      recipientRole: 'customer',
      type: 'order_update',
      titleAr: 'تم إلغاء الطلب',
      titleEn: 'Order cancelled',
      bodyAr: `تم إلغاء طلبك ${order.order_number} واسترجاع النقاط والخصم عند وجودهما.`,
      bodyEn: `Order ${order.order_number} was cancelled and any used points or discount were restored.`,
      referenceId: order.id,
      referenceType: 'order',
      data: { status: 'cancelled' },
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error('[POST /api/orders/:id/cancel]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
