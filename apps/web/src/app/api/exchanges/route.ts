import { NextResponse } from 'next/server';
import { createPrivateStorageUrlMap } from '@eurostore/database';
import { createAdminSupabaseClient, getSessionClient } from '@/supabase-server';

export async function GET() {
  try {
    const { client: supabase, user } = await getSessionClient();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('exchange_requests')
      .select(`
        id, order_id, order_item_id, reason, reason_ar, reason_en,
        customer_whatsapp, status, resolution_path, partner_id,
        qr_code_expires_at, qr_code_used_at, rejection_reason,
        replacement_variant_id, replacement_order_id, created_at, updated_at,
        exchange_request_images(id, url, uploaded_at)
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const rows = data ?? [];
    const signedUrls = await createPrivateStorageUrlMap(
      createAdminSupabaseClient(),
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

    return NextResponse.json({
      data: responseRows,
      total: data?.length ?? 0,
      page: 1,
      per_page: data?.length ?? 0,
    });
  } catch (error) {
    console.error('[GET /api/exchanges]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
