import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminContext } from '@/supabase-server';
import { notifyExchangeCustomer, writeExchangeHistory } from '../../_lib';

const schema = z.object({
  status: z.enum(['item_received_by_shipping', 'completed']),
  notes: z.string().trim().optional(),
});

const allowedTransitions: Record<string, string[]> = {
  approved: ['item_received_by_shipping'],
  item_received_by_shipping: ['completed'],
};

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

    const allowed = allowedTransitions[String(exchange.status)] ?? [];
    if (!allowed.includes(parsed.data.status)) {
      return NextResponse.json({ error: 'invalid_transition' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await ctx.admin
      .from('exchange_requests')
      .update({
        status: parsed.data.status,
        updated_at: now,
      } as never)
      .eq('id', (await params).id)
      .select('*')
      .single();

    if (updateError) throw updateError;

    await writeExchangeHistory(ctx.admin, exchange.id, parsed.data.status, ctx.userId, 'admin', parsed.data.notes ?? null);
    const labels: Record<string, { ar: string; en: string }> = {
      item_received_by_shipping: {
        ar: 'تم استلام طلب الاستبدال من شركة الشحن',
        en: 'Exchange item received by shipping',
      },
      completed: {
        ar: 'اكتمل طلب الاستبدال',
        en: 'Exchange completed',
      },
    };
    await notifyExchangeCustomer(
      ctx.admin,
      exchange.customer_id,
      exchange.id,
      parsed.data.status,
      labels[parsed.data.status]?.ar ?? 'تحديث طلب الاستبدال',
      labels[parsed.data.status]?.en ?? 'Exchange update',
      labels[parsed.data.status]?.ar ?? 'تم تحديث طلب الاستبدال.',
      labels[parsed.data.status]?.en ?? 'Your exchange request was updated.',
    );
    await ctx.admin.from('audit_logs').insert({
      actor_id: ctx.userId,
      actor_role: 'admin',
      action: 'exchange.status_updated',
      entity_type: 'exchange_requests',
      entity_id: exchange.id,
      before_state: { status: exchange.status },
      after_state: { status: parsed.data.status, notes: parsed.data.notes ?? null },
      ip_address: null,
      user_agent: null,
    } as never);

    return NextResponse.json({ exchange_request: updated });
  } catch (error) {
    console.error('[POST /api/admin/exchanges/:id/status]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
