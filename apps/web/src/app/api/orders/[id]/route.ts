import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { getSessionClient } from '@/supabase-server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { client: supabase, user } = await getSessionClient();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const query = supabase
      .from('orders')
      .select('*, order_items(id, variant_id, product_snapshot, quantity, unit_price_syp, total_price_syp, product_variants(product_id))')
      .eq('customer_id', user.id);

    const byUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test((await params).id);
    const { data, error } = await (byUuid ? query.eq('id', (await params).id) : query.eq('order_number', (await params).id)).maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json({ order: data });
  } catch (error) {
    console.error('[GET /api/orders/:id]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
