import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminSupabaseClient, getSessionClient } from '@/supabase-server';

const schema = z.object({
  order_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const { user } = await getSessionClient();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

    const admin = createAdminSupabaseClient();
    const { data: order } = await admin
      .from('orders')
      .select('id, customer_id, total_syp, payment_method')
      .eq('id', parsed.data.order_id)
      .eq('customer_id', user.id)
      .maybeSingle();

    if (!order) return NextResponse.json({ error: 'order_not_found' }, { status: 404 });

    const { data: transaction, error } = await admin
      .from('payment_transactions')
      .insert({
        order_id: order.id,
        gateway: 'sham_cash',
        amount: Number(order.total_syp ?? 0),
        status: 'failed',
        error_message: 'Sham Cash API credentials/documentation pending',
      } as never)
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({
      error: 'payment_provider_unavailable',
      transaction_id: transaction.id,
    }, { status: 503 });
  } catch (error) {
    console.error('[POST /api/payments/sham-cash/initiate]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
