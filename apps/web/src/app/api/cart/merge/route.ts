import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCustomer } from '../_lib';

const itemSchema = z.object({
  itemType: z.enum(['variant', 'bundle']).optional().default('variant'),
  itemId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
  product_variant_id: z.string().uuid().optional(),
  quantity: z.number().int().min(1).max(99),
});

const schema = z.object({
  items: z.array(itemSchema).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireCustomer();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }

    const items = parsed.data.items.flatMap((item) => {
      const itemId = item.itemId ?? item.product_variant_id ?? item.variantId;
      return itemId ? [{ item_type: item.itemType, item_id: itemId, quantity: item.quantity }] : [];
    });
    const { data, error } = await ctx.admin.rpc('merge_customer_cart_v2', {
      p_customer_id: ctx.user.id,
      p_items: items,
    });
    if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

    return NextResponse.json({ merged: data ?? [] });
  } catch (error) {
    console.error('[POST /api/cart/merge]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
