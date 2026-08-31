import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { createPrivateStorageUrlMap } from '@eurostore/database';
import { createAdminSupabaseClient, getSessionClient } from '@/supabase-server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { client: supabase, user } = await getSessionClient();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('exchange_requests')
      .select(`
        id, order_id, order_item_id, customer_id, reason, reason_ar, reason_en,
        customer_whatsapp, status, resolution_path, partner_id, partner_stage,
        qr_code_url, qr_code_expires_at, qr_code_used_at,
        rejection_reason, replacement_variant_id, replacement_order_id,
        created_at, updated_at,
        exchange_request_images(id, url, uploaded_at),
        order_items!order_item_id(id, variant_id, quantity, product_snapshot)
      `)
      .eq('id', (await params).id)
      .eq('customer_id', user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const signer = createAdminSupabaseClient();
    const signedUrls = await createPrivateStorageUrlMap(
      signer,
      'exchange-images',
      data.exchange_request_images?.map((image) => image.url) ?? [],
    );
    const signedQrUrls = await createPrivateStorageUrlMap(signer, 'exchange-qr-codes', [data.qr_code_url]);
    return NextResponse.json({
      exchange_request: {
        ...data,
        qr_code_url: data.qr_code_url ? signedQrUrls.get(data.qr_code_url) ?? null : null,
        exchange_request_images: data.exchange_request_images?.map((image) => ({
          ...image,
          url: signedUrls.get(image.url) ?? null,
        })).filter((image) => image.url) ?? [],
      },
    });
  } catch (error) {
    console.error('[GET /api/exchanges/:id]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
