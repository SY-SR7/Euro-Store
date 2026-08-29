import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminSupabaseClient } from '@/supabase-server';

const slugSchema = z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const parsed = slugSchema.safeParse((await params).slug);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_slug' }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { data: product, error: productError } = await admin
    .from('products')
    .select('id, category_id, brand_id')
    .eq('slug', parsed.data)
    .eq('status', 'published')
    .maybeSingle();
  if (productError) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!product) return NextResponse.json({ data: [], total: 0, page: 1, per_page: 0 });

  let query = admin.from('products').select(`
    id, name_ar, name_en, slug, base_price, created_at,
    discount_percentage, discount_start_at, discount_end_at,
    product_images(url, is_primary, sort_order),
    product_variants(price_override, price_syp, stock_quantity, is_active)
  `).eq('status', 'published').neq('id', product.id).limit(8);
  if (product.category_id) query = query.eq('category_id', product.category_id);
  else if (product.brand_id) query = query.eq('brand_id', product.brand_id);

  const [{ data, error }, { data: badgeSetting }] = await Promise.all([
    query,
    admin.from('system_settings').select('value').eq('key', 'new_badge_days').maybeSingle(),
  ]);
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

  const newBadgeDays = Math.max(1, Number.parseInt(badgeSetting?.value ?? '30', 10) || 30);
  const now = Date.now();
  const rows = (data ?? []).map((related) => {
    const prices = related.product_variants.filter((variant) => variant.is_active).map((variant) => variant.price_override ?? variant.price_syp);
    const discountActive = related.discount_percentage !== null
      && (!related.discount_start_at || new Date(related.discount_start_at).getTime() <= now)
      && (!related.discount_end_at || new Date(related.discount_end_at).getTime() >= now);
    const image = [...related.product_images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];
    return {
      id: related.id, name_ar: related.name_ar, name_en: related.name_en, slug: related.slug,
      base_price: related.base_price ?? 0,
      primary_image_url: image?.url ?? null,
      min_price: prices.length ? Math.min(...prices) : related.base_price ?? 0,
      is_new: related.created_at ? now - new Date(related.created_at).getTime() <= newBadgeDays * 86400000 : false,
      is_on_sale: discountActive,
    };
  });
  return NextResponse.json({ data: rows, total: rows.length, page: 1, per_page: rows.length });
}
