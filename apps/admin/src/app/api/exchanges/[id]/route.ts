import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/supabase-server';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdminClient();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await admin
    .from('exchange_requests')
    .select('*, exchange_items(*, product_variants(sku))')
    .eq('id', params.id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdminClient();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { status?: string; notes?: string };
  const allowed = ['pending','approved','rejected','completed','qr_generated','qr_scanned','expired'];
  if (body.status && !allowed.includes(body.status))
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await admin.from('exchange_requests').update(body as any).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log
  await admin.from('audit_logs').insert({
    actor_role:  'admin',
    action:      `exchange_${body.status ?? 'updated'}`,
    entity_type: 'exchange_requests',
    entity_id:   params.id,
    after_state: body,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any).catch(() => {});

  return NextResponse.json(data);
}