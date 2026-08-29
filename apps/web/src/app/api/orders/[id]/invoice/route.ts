import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { createInvoicePdf, type InvoiceOrder } from '@/lib/invoice-pdf';
import { getSessionClient } from '@/supabase-server';

const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { client: supabase, user } = await getSessionClient();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const query = supabase
      .from('orders')
      .select(`
        order_number, status, payment_status, payment_method, subtotal_syp, discount_syp,
        loyalty_discount_syp, shipping_syp, total_syp, loyalty_points_used,
        loyalty_points_earned, notes, address_snapshot, created_at,
        order_items(quantity, unit_price_syp, total_price_syp, product_snapshot)
      `)
      .eq('customer_id', user.id);

    const { data: order, error } = await (
      uuidRe.test((await params).id) ? query.eq('id', (await params).id) : query.eq('order_number', (await params).id)
    ).maybeSingle();
    if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
    if (!order) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const pdf = await createInvoicePdf(order as unknown as InvoiceOrder);
    const body = new ArrayBuffer(pdf.byteLength);
    new Uint8Array(body).set(pdf);
    const safeNumber = order.order_number.replace(/[^A-Za-z0-9_-]/g, '');
    return new NextResponse(body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${safeNumber}.pdf"`,
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[GET /api/orders/:id/invoice]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
