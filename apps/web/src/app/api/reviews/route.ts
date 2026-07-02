// @ts-nocheck
/* eslint-disable */
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, getSessionClient } from '@/supabase-server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const submitSchema = z.object({
  product_id: z.string().uuid(),
  order_id:   z.string().min(1), // order_number from the order detail page
  rating:     z.number().int().min(1).max(5),
  comment:    z.string().max(2000).nullable().optional(),
});

// GET /api/reviews?product_id=... -> approved reviews + average rating + count
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    if (!productId) {
      return NextResponse.json({ error: 'missing_product_id' }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from('product_reviews')
      .select('id, rating, comment, created_at, customer_profiles(full_name)')
      .eq('product_id', productId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

    const reviews = (data ?? []) as any[];
    const count = reviews.length;
    const average = count > 0
      ? Math.round((reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / count) * 10) / 10
      : 0;

    return NextResponse.json({
      average,
      count,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        customer_name: r.customer_profiles?.full_name ?? 'عميل',
      })),
    });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

// POST /api/reviews -> submit a new review (must own the order, order must be completed)
export async function POST(request: Request) {
  try {
    const { user } = await getSessionClient();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const body: unknown = await request.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 });
    }
    const { product_id, order_id, rating, comment } = parsed.data;

    const admin = createAdminSupabaseClient();

    // Resolve order_number -> order row, verify ownership + status
    const { data: order, error: orderErr } = await admin
      .from('orders')
      .select('id, customer_id, status, order_items(variant_id, product_variants(product_id))')
      .eq('order_number', order_id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'order_not_found' }, { status: 404 });
    }
    if (order.customer_id !== user.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    if (order.status !== 'completed') {
      return NextResponse.json({ error: 'order_not_completed' }, { status: 400 });
    }

    const items = (order.order_items ?? []) as any[];
    const productInOrder = items.some((i) => i.product_variants?.product_id === product_id);
    if (!productInOrder) {
      return NextResponse.json({ error: 'product_not_in_order' }, { status: 400 });
    }

    const { data: review, error: insertErr } = await admin
      .from('product_reviews')
      .insert({
        product_id,
        customer_id: user.id,
        order_id: order.id,
        rating,
        comment: comment ?? null,
        status: 'pending',
      })
      .select('id, status')
      .single();

    if (insertErr) {
      // UNIQUE (order_id, product_id) violation -> already reviewed
      if (insertErr.code === '23505') {
        return NextResponse.json({ error: 'already_reviewed' }, { status: 409 });
      }
      return NextResponse.json({ error: 'database_error' }, { status: 500 });
    }

    return NextResponse.json(review, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
