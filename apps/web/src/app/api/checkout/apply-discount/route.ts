/* eslint-disable */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@eurostore/database';

const applyDiscountSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().min(0),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = applyDiscountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error }, { status: 400 });
    }

    const { code, subtotal } = parsed.data;

    const supabase = createClient();
    const { data: discountCode, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !discountCode) {
      return NextResponse.json({ error: 'Invalid discount code' }, { status: 400 });
    }

    if (!discountCode.is_active) {
      return NextResponse.json({ error: 'Discount code is inactive' }, { status: 400 });
    }

    const now = new Date();
    if (discountCode.valid_from && new Date(discountCode.valid_from) > now) {
      return NextResponse.json({ error: 'Discount code is not yet valid' }, { status: 400 });
    }

    if (discountCode.valid_until && new Date(discountCode.valid_until) < now) {
      return NextResponse.json({ error: 'Discount code has expired' }, { status: 400 });
    }

    if (discountCode.usage_limit && discountCode.uses_count >= discountCode.usage_limit) {
      return NextResponse.json({ error: 'Discount code usage limit reached' }, { status: 400 });
    }

    if (discountCode.min_order_value_syp && subtotal < discountCode.min_order_value_syp) {
      return NextResponse.json({ error: `Minimum order value for this code is ${discountCode.min_order_value_syp} SYP` }, { status: 400 });
    }

    let discountAmount = 0;
    if (discountCode.discount_amount_syp) {
      discountAmount = discountCode.discount_amount_syp;
    } else if (discountCode.discount_percentage) {
      discountAmount = Math.floor((subtotal * discountCode.discount_percentage) / 100);
    }

    // Don't discount more than subtotal
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }

    return NextResponse.json({ 
      success: true, 
      discountAmount, 
      code: discountCode.code 
    });
  } catch (error) {
    console.error('Error applying discount:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

