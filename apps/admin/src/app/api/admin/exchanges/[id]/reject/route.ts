import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminContext } from '@/supabase-server';
import { notifyExchangeCustomer } from '../../_lib';

const schema = z.object({
  rejection_reason: z.string().trim().min(2),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAdminContext('exchange_management', 'edit');
    if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }

    const { data: exchange, error: fetchError } = await ctx.admin
      .from('exchange_requests')
      .select('id, customer_id, status')
      .eq('id', (await params).id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!exchange) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    if (exchange.status !== 'pending') {
      return NextResponse.json({ error: 'already_processed' }, { status: 400 });
    }

    const { data: updated, error: updateError } = await ctx.admin.rpc('reject_exchange_request_atomic', {
      p_exchange_request_id: exchange.id,
      p_rejection_reason: parsed.data.rejection_reason,
      p_actor_id: ctx.userId,
      p_actor_role: 'admin',
    });
    if (updateError) {
      if (updateError.message.includes('already_processed')) return NextResponse.json({ error: 'already_processed' }, { status: 409 });
      throw updateError;
    }
    await notifyExchangeCustomer(
      ctx.admin,
      exchange.customer_id,
      exchange.id,
      'rejected',
      'تم رفض طلب الاستبدال',
      'Exchange request rejected',
      parsed.data.rejection_reason,
      parsed.data.rejection_reason,
    );
    return NextResponse.json({ exchange_request: updated });
  } catch (error) {
    console.error('[POST /api/admin/exchanges/:id/reject]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
