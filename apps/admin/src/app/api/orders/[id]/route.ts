import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase-server';
import { z } from 'zod';

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:    ['confirmed', 'cancelled'],
  confirmed:  ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped:    ['delivered'],
  delivered:  [],
  cancelled:  [],
};

const updateSchema = z.object({
  status: z.enum(['pending','confirmed','processing','shipped','delivered','cancelled']),
  notes:  z.string().optional(),
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(id, variant_id, product_snapshot, quantity, unit_price_syp, total_price_syp)')
    .eq('id', params.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .single() as any;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Shape order_items so frontend can access unit_price / total_price
  const shaped = {
    ...data,
    order_items: (data.order_items ?? [])// eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((item: any) => {
      const snap = (item.product_snapshot ?? {}) as Record<string, unknown>;
      return {
        ...item,
        unit_price: item.unit_price_syp,
        total_price: item.total_price_syp,
        product_variants: {
          sku: snap['sku'] ?? '',
          attributes: [],
          products: { name_ar: snap['name_ar'] ?? '', name_en: snap['name_en'] ?? '' },
        },
      };
    }),
  };

  return NextResponse.json(shaped);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body: unknown = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data: order } = await supabase.from('orders').select('status').eq('id', params.id).single();
  const currentStatus = (order as { status: string } | null)?.status ?? '';
  const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(parsed.data.status)) {
    return NextResponse.json({ error: `Cannot transition from ${currentStatus} to ${parsed.data.status}` }, { status: 422 });
  }

  const { data, error } = await supabase
    .from('orders').update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_logs').insert({
    actor_id:    user.id,
    actor_role:  'admin' as const,
    action:      'order.status_update',
    entity_type: 'orders',
    entity_id:   params.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    before_state: { status: currentStatus } as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    after_state:  { status: parsed.data.status, notes: parsed.data.notes } as any,
  } as any);

  return NextResponse.json(data);
}
