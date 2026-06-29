import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/supabase-server';

interface RouteParams { params: { id: string } }

export async function PATCH(request: Request, { params }: RouteParams) {
  const admin = await requireAdminClient();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const allowed = ['name','slug','is_active'];
  const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await admin.from('brands').update(update as any).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const admin = await requireAdminClient();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { error } = await admin.from('brands').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}