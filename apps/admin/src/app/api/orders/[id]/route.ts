import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClientFromEnv } from '@eurostore/database';
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
  const cookieStore = cookies();
  const supabase = createSupabaseServerClientFromEnv(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, product_variants(sku, attributes, products(name_ar, name_en)))')
    .eq('id', params.id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClientFromEnv(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body: unknown = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Validate state machine transition
  const { data: order } = await supabase.from('orders').select('status').eq('id', params.id).single();
  const allowed = VALID_TRANSITIONS[(order as { status: string } | null)?.status ?? ''] ?? [];
  if (!allowed.includes(parsed.data.status)) {
    return NextResponse.json({ error: `Cannot transition from ${(order as { status: string } | null)?.status} to ${parsed.data.status}` }, { status: 422 });
  }

  const { data, error } = await supabase
    .from('orders').update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_logs').insert({
    admin_id: user.id, action: 'order_status_update',
    table_name: 'orders', record_id: params.id,
    old_values: { status: (order as { status: string } | null)?.status },
    new_values: { status: parsed.data.status, notes: parsed.data.notes },
  });

  return NextResponse.json(data);
}