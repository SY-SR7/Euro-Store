import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClientFromEnv } from '@eurostore/database';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClientFromEnv(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body: Record<string, unknown> = await request.json() as Record<string, unknown>;
  const { data, error } = await supabase
    .from('homepage_sections').update(body).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_logs').insert({
    admin_id: user.id, action: 'homepage_section_update',
    table_name: 'homepage_sections', record_id: params.id, new_values: body,
  });
  return NextResponse.json(data);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClientFromEnv(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { error } = await supabase.from('homepage_sections').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_logs').insert({
    admin_id: user.id, action: 'homepage_section_delete',
    table_name: 'homepage_sections', record_id: params.id,
  });
  return NextResponse.json({ success: true });
}