import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createInAppNotification } from '@eurostore/database';
import { requireHelperContext } from '@/lib/helper-context';

const schema = z.object({ rejection_reason: z.string().trim().min(2).max(2000) }).strict();

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireHelperContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  if (!z.string().uuid().safeParse((await params).id).success) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  const { data: exchange, error: loadError } = await ctx.admin.from('exchange_requests').select('id, customer_id, status').eq('id', (await params).id).maybeSingle();
  if (loadError) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!exchange) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const { data: updated, error } = await ctx.admin.rpc('reject_exchange_request_atomic', {
    p_exchange_request_id: exchange.id, p_rejection_reason: parsed.data.rejection_reason,
    p_actor_id: ctx.user.id, p_actor_role: 'helper',
  });
  if (error) {
    if (error.message.includes('already_processed')) return NextResponse.json({ error: 'already_processed' }, { status: 409 });
    return NextResponse.json({ error: 'database_error' }, { status: 500 });
  }
  await createInAppNotification(ctx.admin, {
    recipientId: exchange.customer_id, recipientRole: 'customer', type: 'exchange_update',
    titleAr: 'تم رفض طلب الاستبدال', titleEn: 'Exchange request rejected',
    bodyAr: parsed.data.rejection_reason, bodyEn: parsed.data.rejection_reason,
    referenceId: exchange.id, referenceType: 'exchange', data: { status: 'rejected' },
  });
  return NextResponse.json({ exchange_request: updated });
}
