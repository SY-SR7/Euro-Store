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
    admin_id: user.id, action: 'helper_order_update',
    table_name: 'orders', record_id: params.id,
    new_values: { status: parsed.data.status },
  });

  return NextResponse.json(data);
}