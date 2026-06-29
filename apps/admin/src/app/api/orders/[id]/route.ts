import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/supabase-server';
import { z } from 'zod';

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:    ['confirmed','cancelled'],
  confirmed:  ['processing','cancelled'],
  processing: ['shipped','cancelled'],
  shipped:    ['delivered'],
  delivered:  [],
  cancelled:  [],
};

const updateSchema = z.object({
  status: z.enum(['pending','confirmed','processing','shipped','delivered','cancelled']),
  notes:  z.string().optional(),
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdminClient();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await admin.from('orders').select('*, order_items(id,variant_id,product_snapshot,quantity,unit_price_syp,total_price_syp)').eq('id', params.id).single() as any;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdminClient();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = updateSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: current } = await admin.from('orders').select('status').eq('id', params.id).single() as any;
  const allowed = VALID_TRANSITIONS[current?.status ?? ''] ?? [];
  if (!allowed.includes(body.data.status))
    return NextResponse.json({ error: `Cannot transition from ${current?.status} to ${body.data.status}` }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await admin.from('orders').update(body.data as any).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from('audit_logs').insert({
    actor_role:  'admin',
    action:      `order_${body.data.status}`,
    entity_type: 'orders',
    entity_id:   params.id,
    after_state: body.data,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any).catch(() => {});

  return NextResponse.json(data);
}