import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase-server';
import { z } from 'zod';

const sectionSchema = z.object({
  section_key: z.string().min(1),
  title_ar:    z.string().min(1),
  title_en:    z.string().min(1),
  content:     z.record(z.unknown()).optional().default({}),
  is_active:   z.boolean().default(true),
  sort_order:  z.number().int().min(0).default(0),
});

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('homepage_sections')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body: unknown = await request.json();
  const parsed = sectionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase.from('homepage_sections').insert(parsed.data as any).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_logs').insert({
    actor_id:    user.id,
    actor_role:  'admin' as const,
    action:      'homepage_section.create',
    entity_type: 'homepage_sections',
    entity_id:   (data as { id: string }).id,
    after_state: parsed.data as any,
  } as any);
  return NextResponse.json(data, { status: 201 });
}
