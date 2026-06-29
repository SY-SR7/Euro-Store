import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/supabase-server';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdminClient();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await admin.from('discount_codes').update(body as any).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdminClient();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await admin.from('discount_codes').delete().eq('id', params.id);
  return NextResponse.json({ deleted: true });
}