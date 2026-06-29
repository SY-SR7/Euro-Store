import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase-server';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body: Record<string, unknown> = await request.json() as Record<string, unknown>;
  const { data, error } = await supabase
    .from('homepage_sections').update(body as any).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_logs').insert({
    actor_id:    user.id,
    actor_role:  'admin' as const,
    action:      'homepage_section.update',
    entity_type: 'homepage_sections',
    entity_id:   params.id,
    after_state: body as any,
  } as any);
  return NextResponse.json(data);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { error } = await supabase.from('homepage_sections').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_logs').insert({
    actor_id:    user.id,
    actor_role:  'admin' as const,
    action:      'homepage_section.delete',
    entity_type: 'homepage_sections',
    entity_id:   params.id,
  } as any);
  return NextResponse.json({ success: true });
}
