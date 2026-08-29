import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCustomer } from '../_lib';

const schema = z.object({
  points: z.number().int().positive(),
  subtotal: z.number().nonnegative().optional(),
});

async function cartSubtotal(ctx: NonNullable<Awaited<ReturnType<typeof requireCustomer>>>) {
  const { data } = await ctx.admin
    .from('cart_items')
    .select('quantity, product_variants(price_syp)')
    .eq('customer_id', ctx.user.id);
  return (data ?? []).reduce((sum, item) => {
    return sum + Number(item.quantity ?? 0) * Number(item.product_variants?.price_syp ?? 0);
  }, 0);
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireCustomer();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }

    const [{ data: profile }, { data: settingsRows }] = await Promise.all([
      ctx.admin.from('customer_profiles').select('loyalty_points').eq('id', ctx.user.id).maybeSingle(),
      ctx.admin.from('system_settings').select('key, value').in('key', [
        'loyalty_point_value_syp',
        'loyalty_min_redemption_pts',
        'loyalty_max_redemption_pct',
        'loyalty_redeem_value_syp',
        'loyalty_redeem_points',
      ]),
    ]);

    const settings = Object.fromEntries((settingsRows ?? []).map((row) => [row.key, Number(row.value)]));
    const available = Number(profile?.loyalty_points ?? 0);
    const minPoints = settings.loyalty_min_redemption_pts ?? 100;
    const pointValue = settings.loyalty_point_value_syp ?? ((settings.loyalty_redeem_value_syp ?? 1000) / (settings.loyalty_redeem_points ?? 100));
    const maxPct = settings.loyalty_max_redemption_pct ?? 30;
    const subtotal = parsed.data.subtotal ?? await cartSubtotal(ctx);

    if (parsed.data.points > available) return NextResponse.json({ error: 'insufficient_points' }, { status: 422 });
    if (parsed.data.points < minPoints) return NextResponse.json({ error: 'below_min_redemption', min_points: minPoints }, { status: 422 });

    const requestedValue = Math.floor(parsed.data.points * pointValue);
    const maxValue = Math.floor(subtotal * maxPct / 100);
    const discountAmount = Math.min(requestedValue, maxValue);
    const pointsApplied = Math.floor(discountAmount / pointValue);

    return NextResponse.json({
      points_applied: pointsApplied,
      discount_amount: discountAmount,
      balance_after: available - pointsApplied,
    });
  } catch (error) {
    console.error('[POST /api/cart/apply-points]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
