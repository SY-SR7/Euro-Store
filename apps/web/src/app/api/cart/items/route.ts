import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCustomer } from '../_lib';

const schema = z.object({
  itemType: z.enum(['variant', 'bundle']).optional().default('variant'),
  itemId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).max(99).optional().default(1),
}).refine((item) => item.itemId || item.variantId, { message: 'item_id_required' });

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireCustomer();
    if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

    const { data, error } = await ctx.admin.rpc('add_customer_cart_item', {
      p_customer_id: ctx.user.id,
      p_item_type: parsed.data.itemType,
      p_item_id: parsed.data.itemId ?? parsed.data.variantId!,
      p_quantity: parsed.data.quantity,
    });
    if (error) {
      const unavailable = error.message.includes('cart_item_unavailable');
      return NextResponse.json(
        { error: unavailable ? 'item_unavailable' : 'database_error' },
        { status: unavailable ? 409 : 500 },
      );
    }

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/cart/items]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
