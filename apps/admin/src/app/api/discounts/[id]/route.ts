import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClientFromEnv, createSupabaseAdminClientFromEnv } from '@eurostore/database';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase    = createSupabaseServerClientFromEnv(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body  = await req.json() as Record<string, unknown>;
  const admin = createSupabaseAdminClientFromEnv();
  const { data, error } = await admin
    .from('discount_codes')
    .update(body)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase    = createSupabaseServerClientFromEnv(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createSupabaseAdminClientFromEnv();
  await admin.from('discount_codes').delete().eq('id', params.id);
  return NextResponse.json({ success: true });
}