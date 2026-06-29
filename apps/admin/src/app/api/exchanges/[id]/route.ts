import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase-server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createSupabaseAdminClientFromEnv();
  const { data, error } = await admin
    .from('exchange_requests')
    .select('*, exchange_items(*, product_variants(sku))')
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { status?: string; notes?: string };
  const allowed = ['pending', 'approved', 'rejected', 'completed', 'qr_generated', 'qr_scanned', 'expired'];
  if (body.status && !allowed.includes(body.status))
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (body.status) update['status'] = body.status;
  if (body.notes !== undefined) update['notes'] = body.notes;

  const admin = createSupabaseAdminClientFromEnv();
  const { data, error } = await admin
    .from('exchange_requests')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(update as any)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await admin.from('audit_logs').insert({
    actor_id  : user.id,
    actor_role: 'admin' as const,
    action    : `exchange.update`,
    entity_type: 'exchange_requests',
    entity_id  : params.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    after_state: update as any,
  } as any);

  return NextResponse.json(data);
}
