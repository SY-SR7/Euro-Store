import { NextResponse } from 'next/server';
import { createPrivateStorageUrlMap } from '@eurostore/database';
import { getPartnerContext } from './_lib';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await getPartnerContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data, error } = await ctx.admin.from('exchange_requests').select(`
    id, order_id, order_item_id, reason, status, partner_stage,
    qr_code_expires_at, qr_code_used_at, created_at, updated_at,
    exchange_request_images(id, url, uploaded_at)
  `).eq('partner_id', ctx.userId).eq('resolution_path', 'partner').in('status', ['approved', 'item_received_by_shipping', 'completed']).order('created_at', { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  const exchanges = data ?? [];
  const orderItemIds = exchanges.map((row) => row.order_item_id);
  const { data: orderItems, error: orderItemsError } = orderItemIds.length
    ? await ctx.admin.from('order_items').select('id, variant_id, quantity, product_snapshot').in('id', orderItemIds)
    : { data: [] as Array<{ id: string; variant_id: string | null; quantity: number; product_snapshot: unknown }>, error: null };
  if (orderItemsError) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  const orderItemById = new Map((orderItems ?? []).map((item) => [item.id, item]));
  const rows = exchanges.map((row) => ({
    ...row,
    order_items: orderItemById.get(row.order_item_id) ?? null,
  }));
  const variantIds = rows.flatMap((row) => row.order_items?.variant_id ? [row.order_items.variant_id] : []);
  const { data: variants } = variantIds.length
    ? await ctx.admin.from('product_variants').select('id, product_id').in('id', variantIds)
    : { data: [] as Array<{ id: string; product_id: string | null }> };
  const productByVariant = new Map((variants ?? []).map((variant) => [variant.id, variant.product_id]));
  const productIds = [...new Set((variants ?? []).flatMap((variant) => variant.product_id ? [variant.product_id] : []))];
  const { data: productImages } = productIds.length
    ? await ctx.admin.from('product_images').select('product_id, url, is_primary, sort_order').in('product_id', productIds).order('is_primary', { ascending: false }).order('sort_order')
    : { data: [] as Array<{ product_id: string | null; url: string }> };
  const imageByProduct = new Map<string, string>();
  for (const image of productImages ?? []) {
    if (image.product_id && !imageByProduct.has(image.product_id)) imageByProduct.set(image.product_id, image.url);
  }
  const signedUrls = await createPrivateStorageUrlMap(ctx.admin, 'exchange-images', rows.flatMap((row) => row.exchange_request_images?.map((image) => image.url) ?? []));
  const responseRows = rows.map((row) => ({
    ...row,
    catalog_image_url: row.order_items?.variant_id
      ? imageByProduct.get(productByVariant.get(row.order_items.variant_id) ?? '') ?? null
      : null,
    exchange_request_images: row.exchange_request_images?.map((image) => ({
      ...image,
      url: signedUrls.get(image.url) ?? null,
    })).filter((image) => image.url) ?? [],
  }));
  return NextResponse.json({ data: responseRows, total: responseRows.length, page: 1, per_page: responseRows.length });
}
