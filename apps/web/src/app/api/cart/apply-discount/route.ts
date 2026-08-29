import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCustomer } from '../_lib';
import { validateDiscountForCustomerCart } from '../_discount';

const schema = z.object({
  code: z.string().trim().min(1),
  subtotal: z.number().nonnegative().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireCustomer();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }

    const result = await validateDiscountForCustomerCart(ctx, parsed.data.code);
    if (!result.ok) {
      return NextResponse.json({ error: result.error, ...(result.details ?? {}) }, { status: result.status });
    }

    return NextResponse.json({ discount_code: result.discount, discount_amount: result.discountAmount });
  } catch (error) {
    console.error('[POST /api/cart/apply-discount]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
