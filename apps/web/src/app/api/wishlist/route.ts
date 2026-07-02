// @ts-nocheck
/* eslint-disable */
import { NextResponse } from 'next/server';
import { getSessionClient } from '@/supabase-server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const toggleSchema = z.object({
  product_id: z.string().uuid(),
});

// GET /api/wishlist -> { authenticated, items: [{product_id, ...product fields}] }
export async function GET() {
  try {
    const { client: supabase, user } = await getSessionClient();
    if (!user) return NextResponse.json({ authenticated: false, items: [] });

    const { data, error } = await supabase
      .from('wishlist_items')
      .select('id, product_id, created_at, products(id, name_ar, name_en, slug, is_active, product_images(url, is_primary), product_variants(id, price_syp, compare_price_syp, stock_quantity))')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

    const items = (data ?? []).map((row: any) => {
      const product = row.products;
      const variants = (product?.product_variants ?? []) as any[];
      const totalStock = variants.reduce((s, v) => s + Number(v.stock_quantity || 0), 0);
      const minPrice = variants.length
        ? Math.min(...variants.map((v) => Number(v.price_syp || 0)))
        : null;
      const images = (product?.product_images ?? []) as any[];
      const primaryImage = images.find((i) => i.is_primary)?.url ?? images[0]?.url ?? null;

      return {
        wishlist_id: row.id,
        product_id: row.product_id,
        added_at: row.created_at,
        slug: product?.slug ?? null,
        name_ar: product?.name_ar ?? '',
        name_en: product?.name_en ?? '',
        is_active: product?.is_active ?? false,
        image_url: primaryImage,
        min_price_syp: minPrice,
        in_stock: totalStock > 0,
      };
    });

    return NextResponse.json({ authenticated: true, items });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

// POST /api/wishlist -> toggles a product in/out of the wishlist. Returns { in_wishlist: boolean }
export async function POST(request: Request) {
  try {
    const { client: supabase, user } = await getSessionClient();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const body: unknown = await request.json();
    const parsed = toggleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }
    const { product_id } = parsed.data;

    const { data: existing } = await supabase
      .from('wishlist_items')
      .select('id')
      .eq('customer_id', user.id)
      .eq('product_id', product_id)
      .maybeSingle();

    if (existing) {
      const { error: delErr } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', existing.id);
      if (delErr) return NextResponse.json({ error: 'database_error' }, { status: 500 });
      return NextResponse.json({ in_wishlist: false });
    }

    const { error: insErr } = await supabase
      .from('wishlist_items')
      .insert({ customer_id: user.id, product_id });
    if (insErr) return NextResponse.json({ error: 'database_error' }, { status: 500 });
    return NextResponse.json({ in_wishlist: true });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
