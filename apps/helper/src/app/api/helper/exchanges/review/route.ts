import { NextResponse } from 'next/server';
import { createPrivateStorageUrlMap } from '@eurostore/database';
import { requireHelperContext } from '@/lib/helper-context';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await requireHelperContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data, error } = await ctx.admin.from('exchange_requests').select(`
    id, order_id, customer_id, reason, status, created_at,
    qr_code_expires_at, qr_code_used_at, rejection_reason,
    resolution_path, partner_id,
    customer_profiles!customer_id ( full_name, phone ),
    exchange_request_images(id, url, uploaded_at)
  `).in('status', ['pending', 'approved']).order('created_at', { ascending: true }).limit(100);
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  const rows = data ?? [];
  const signedUrls = await createPrivateStorageUrlMap(
    ctx.admin,
    'exchange-images',
    rows.flatMap((row) => row.exchange_request_images?.map((image) => image.url) ?? []),
  );
  const responseRows = rows.map((row) => ({
    ...row,
    exchange_request_images: row.exchange_request_images?.map((image) => ({
      ...image,
      url: signedUrls.get(image.url) ?? null,
    })).filter((image) => image.url) ?? [],
  }));
  return NextResponse.json({ data: responseRows, total: responseRows.length, page: 1, per_page: responseRows.length });
}
