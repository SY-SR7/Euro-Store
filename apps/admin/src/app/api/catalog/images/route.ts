import { requireAdminContext } from '@/supabase-server';
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';
import { z } from 'zod';

const createSchema = z.object({
  product_id: z.string().uuid(),
  url: z.string().url().max(2048),
  alt_ar: z.string().max(500).optional(),
  is_primary: z.boolean().optional(),
}).strict();

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const ctx = await requireAdminContext('product_management', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const product_id = searchParams.get('product_id') ?? '';
  const admin = createAdminSupabaseClient();
  let query = admin.from('product_images').select('id,product_id,url,alt_ar,is_primary,sort_order').order('sort_order');
  if (product_id) query = query.eq('product_id', product_id);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const ctx = await requireAdminContext('product_management', 'create');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    const input = parsed.data;
    const admin = createAdminSupabaseClient();
    // If is_primary, unset other primaries first
    if (input.is_primary) {
      await admin.from('product_images').update({ is_primary: false }).eq('product_id', input.product_id);
    }
    const { data: maxOrder } = await admin.from('product_images').select('sort_order').eq('product_id', input.product_id).order('sort_order', { ascending: false }).limit(1).maybeSingle();
    const nextOrder = (maxOrder?.sort_order ?? 0) + 1;
    const { data, error } = await admin.from('product_images').insert({
      product_id: input.product_id,
      url: input.url,
      alt_ar: input.alt_ar ?? '',
      is_primary: input.is_primary ?? false,
      sort_order: nextOrder,
    }).select('id').single();
    if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}
