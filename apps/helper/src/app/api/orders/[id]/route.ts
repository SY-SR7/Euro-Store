import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '../../../../supabase-server';
import { z } from 'zod';

const schema = z.object({
  status: z.enum(['processing', 'shipped']),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body: unknown = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase
    .from('orders').update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq('id', params.id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_logs').insert({
    actor_id: user.id, actor_role: 'helper', action: 'helper_order_update',
    entity_type: 'orders', entity_id: params.id,
    before_state: {}, after_state: { status: parsed.data.status },
    ip_address: null, user_agent: null
  });

  return NextResponse.json(data);
}