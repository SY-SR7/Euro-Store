import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCustomer } from '../../_lib';

const idSchema = z.string().uuid();
const updateSchema = z.object({ quantity: z.number().int().min(1).max(99) });

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const ctx = await requireCustomer();
    if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const id = idSchema.safeParse((await params).id);
    const body = updateSchema.safeParse(await request.json().catch(() => null));
    if (!id.success || !body.success) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }

    const { data, error } = await ctx.admin.rpc('set_customer_cart_item_quantity', {
      p_customer_id: ctx.user.id,
      p_cart_item_id: id.data,
      p_quantity: body.data.quantity,
    });
    if (error) {
      const notFound = error.message.includes('cart_item_not_found');
      const unavailable = error.message.includes('cart_item_unavailable');
      const status = notFound ? 404 : unavailable ? 409 : 500;
      return NextResponse.json({ error: notFound ? 'not_found' : unavailable ? 'item_unavailable' : 'database_error' }, { status });
    }

    return NextResponse.json({ item: data });
  } catch (error) {
    console.error('[PUT /api/cart/items/:id]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const ctx = await requireCustomer();
    if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const id = idSchema.safeParse((await params).id);
    if (!id.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

    const { data, error } = await ctx.admin.rpc('remove_customer_cart_item', {
      p_customer_id: ctx.user.id,
      p_cart_item_id: id.data,
    });
    if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/cart/items/:id]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
