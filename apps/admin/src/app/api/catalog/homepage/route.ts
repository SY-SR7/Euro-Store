import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClientFromEnv } from '@eurostore/database';
import { z } from 'zod';

const sectionSchema = z.object({
  title_ar:    z.string().min(1),
  title_en:    z.string().min(1),
  type:        z.enum(['hero', 'featured_products', 'banner', 'categories_grid', 'loyalty_teaser']),
  position:    z.number().int().min(0).default(0),
  is_active:   z.boolean().default(true),
  config_json: z.record(z.unknown()).optional().default({}),
});

export async function GET() {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClientFromEnv(cookieStore);
  const { data, error } = await supabase
    .from('homepage_sections')
    .select('*')
    .order('position', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClientFromEnv(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body: unknown = await request.json();
  const parsed = sectionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase.from('homepage_sections').insert(parsed.data).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_logs').insert({
    admin_id: user.id, action: 'homepage_section_create',
    table_name: 'homepage_sections', record_id: (data as { id: string }).id,
    new_values: parsed.data,
  });
  return NextResponse.json(data, { status: 201 });
}