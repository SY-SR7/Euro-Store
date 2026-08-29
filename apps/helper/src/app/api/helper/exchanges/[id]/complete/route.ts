import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createInAppNotification, dispatchPendingNotifications } from '@eurostore/database';
import { fetchHelperExchange, getHelperContext } from '../../_lib';

const schema = z.object({
  replacement_variant_id: z.string().uuid(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getHelperContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }

    const current = await fetchHelperExchange(ctx, (await params).id);
    if (!current) return NextResponse.json({ error: 'exchange_not_found' }, { status: 404 });
    if (current.resolution_path !== 'helper') return NextResponse.json({ error: 'not_helper_path' }, { status: 400 });
    if (current.status !== 'approved') return NextResponse.json({ error: 'invalid_status' }, { status: 409 });
    if (!current.qr_code_used_at) return NextResponse.json({ error: 'qr_not_scanned' }, { status: 409 });

    const { data, error } = await ctx.admin.rpc('complete_helper_exchange_secure', {
      p_exchange_request_id: (await params).id,
      p_helper_id: ctx.userId,
      p_replacement_variant_id: parsed.data.replacement_variant_id,
    });

    if (error) {
      const outOfStock = error.message.includes('out_of_stock');
      const unavailable = error.message.includes('inactive') || error.message.includes('variant_not_found');
      return NextResponse.json(
        { error: outOfStock ? 'replacement_out_of_stock' : unavailable ? 'replacement_unavailable' : 'exchange_completion_failed' },
        { status: outOfStock || unavailable ? 409 : 400 },
      );
    }

    await createInAppNotification(ctx.admin, {
      recipientId: current.customer_id,
      recipientRole: 'customer',
      type: 'exchange_update',
      titleAr: 'اكتمل طلب الاستبدال',
      titleEn: 'Exchange completed',
      bodyAr: 'تم إكمال طلب الاستبدال وتسليم البديل.',
      bodyEn: 'Your exchange was completed and the replacement was delivered.',
      referenceId: (await params).id,
      referenceType: 'exchange',
      data: { status: 'completed' },
    });

    await ctx.admin.from('audit_logs').insert({
      actor_id: ctx.userId,
      actor_role: 'helper',
      action: 'exchange.completed_by_helper',
      entity_type: 'exchange_requests',
      entity_id: (await params).id,
      before_state: { status: current.status, replacement_variant_id: current.replacement_variant_id },
      after_state: { status: 'completed', replacement_variant_id: parsed.data.replacement_variant_id },
      ip_address: null,
      user_agent: null,
    } as never);

    await dispatchPendingNotifications(ctx.admin, 100);

    return NextResponse.json({ exchange_request: data });
  } catch (error) {
    console.error('[POST /api/helper/exchanges/:id/complete]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
