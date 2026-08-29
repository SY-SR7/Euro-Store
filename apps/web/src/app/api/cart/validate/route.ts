import { NextResponse } from 'next/server';
import { requireCustomer } from '../_lib';

export async function POST() {
  try {
    const ctx = await requireCustomer();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: items, error } = await ctx.admin
      .from('cart_items')
      .select('id, product_variant_id, quantity, product_variants(id, stock_quantity)')
      .eq('customer_id', ctx.user.id);

    if (error) throw error;

    const conflicts = (items ?? [])
      .map((item) => {
        const stock = Number(item.product_variants?.stock_quantity ?? 0);
        return item.quantity > stock
          ? { cart_item_id: item.id, product_variant_id: item.product_variant_id, requested: item.quantity, available_stock: stock }
          : null;
      })
      .filter(Boolean);

    return NextResponse.json({ valid: conflicts.length === 0, conflicts });
  } catch (error) {
    console.error('[POST /api/cart/validate]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
