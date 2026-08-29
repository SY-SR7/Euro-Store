import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, getSessionClient } from '@/supabase-server';

const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await getSessionClient();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminSupabaseClient();
    const byUuid = uuidRe.test((await params).id);
    const query = admin
      .from('orders')
      .select('id, customer_id, status, order_items(id, variant_id, bundle_id, quantity)')
      .eq('customer_id', user.id);

    const { data: order, error } = await (byUuid ? query.eq('id', (await params).id) : query.eq('order_number', (await params).id)).maybeSingle();
    if (error) throw error;
    if (!order) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    if (order.status !== 'completed') return NextResponse.json({ error: 'order_not_completed' }, { status: 400 });

    const items = order.order_items ?? [];
    const cartItems = items.flatMap((item) => {
      const itemId = item.bundle_id ?? item.variant_id;
      if (!itemId) return [];
      return [{ item_type: item.bundle_id ? 'bundle' : 'variant', item_id: itemId, quantity: Math.max(1, Number(item.quantity || 1)) }];
    });
    const skipped = items.filter((item) => !item.variant_id && !item.bundle_id)
      .map((item) => ({ order_item_id: item.id, reason: 'missing_catalog_item' }));

    if (!cartItems.length) {
      return NextResponse.json({ error: 'no_available_items', skipped }, { status: 409 });
    }

    const { data: cart, error: mergeError } = await admin.rpc('merge_customer_cart_v2', {
      p_customer_id: user.id,
      p_items: cartItems,
    });
    if (mergeError) return NextResponse.json({ error: 'reorder_failed' }, { status: 500 });

    return NextResponse.json({ cart, skipped });
  } catch (error) {
    console.error('[POST /api/orders/:id/reorder]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
