import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, requireAdminClient } from '@/supabase-server';
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
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from('homepage_sections').select('*').order('sort_order');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const admin = await requireAdminClient();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body: unknown = await request.json();
  const parsed = sectionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await admin.from('homepage_sections').insert(parsed.data as any).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}