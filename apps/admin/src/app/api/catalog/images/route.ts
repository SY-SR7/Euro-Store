import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const product_id = searchParams.get('product_id') ?? '';
  const admin = createAdminSupabaseClient();
  let query = admin.from('product_images').select('id,product_id,url,alt_ar,is_primary,sort_order').order('sort_order');
  if (product_id) query = query.eq('product_id', product_id);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { product_id?: string; url?: string; alt_ar?: string; is_primary?: boolean } | null;
    if (!body?.product_id || !body?.url) return NextResponse.json({ error: 'product_id and url required' }, { status: 400 });
    const admin = createAdminSupabaseClient();
    // If is_primary, unset other primaries first
    if (body.is_primary) {
      await admin.from('product_images').update({ is_primary: false } as never).eq('product_id', body.product_id);
    }
    const { data: maxOrder } = await admin.from('product_images').select('sort_order').eq('product_id', body.product_id).order('sort_order', { ascending: false }).limit(1).maybeSingle();
    const nextOrder = ((maxOrder as any)?.sort_order ?? 0) + 1;
    const { data, error } = await admin.from('product_images').insert({
      product_id: body.product_id,
      url: body.url,
      alt_ar: body.alt_ar ?? '',
      is_primary: body.is_primary ?? false,
      sort_order: nextOrder,
    } as never).select('id').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}