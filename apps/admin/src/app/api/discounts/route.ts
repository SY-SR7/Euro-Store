import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, requireAdminContext } from '@/supabase-server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  code:             z.string().min(1).transform(s => s.toUpperCase()),
  description:      z.string().nullable().optional(),
  type:             z.enum(['percentage', 'fixed', 'fixed_amount']),
  value:            z.number().positive(),
  eligibility:      z.enum(['all_users', 'first_time_buyers']).default('all_users'),
  min_order_syp:    z.number().nonnegative().optional(),
  min_cart_value:   z.number().nonnegative().optional(),
  scope:            z.enum(['entire_store', 'categories', 'products']).default('entire_store'),
  category_ids:     z.array(z.string().uuid()).nullable().optional(),
  product_ids:      z.array(z.string().uuid()).nullable().optional(),
  valid_from:       z.string().optional(),
  valid_until:      z.string().optional(),
  max_uses:         z.number().int().positive().nullable().optional(),
  max_uses_total:   z.number().int().positive().nullable().optional(),
  max_uses_per_user:z.number().int().positive().nullable().optional(),
  is_active:        z.boolean().default(true),
});

export async function GET() {
  const ctx = await requireAdminContext('discount_code_management', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from('discount_codes')
      .select('id,code,description,type,value,eligibility,min_order_syp,min_cart_value,scope,category_ids,product_ids,valid_from,valid_until,max_uses,max_uses_total,max_uses_per_user,used_count,uses_count,is_active,created_by,created_at,updated_at')
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}

export async function POST(request: Request) {
  const ctx = await requireAdminContext('discount_code_management', 'create');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
const { admin, userId } = ctx;
  try {
    const body: unknown = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    const now = new Date().toISOString();
    const in90 = new Date(Date.now() + 90*24*60*60*1000).toISOString();
    const minOrderSyp = parsed.data.min_order_syp ?? parsed.data.min_cart_value ?? 0;
    const maxUses = parsed.data.max_uses ?? parsed.data.max_uses_total ?? null;
    const { data, error } = await admin.from('discount_codes').insert({
      code: parsed.data.code,
      description: parsed.data.description ?? null,
      type: parsed.data.type,
      value: parsed.data.value,
      eligibility: parsed.data.eligibility,
      min_order_syp: minOrderSyp,
      scope: parsed.data.scope,
      category_ids: parsed.data.scope === 'categories' ? (parsed.data.category_ids ?? []) : null,
      product_ids: parsed.data.scope === 'products' ? (parsed.data.product_ids ?? []) : null,
      max_uses: maxUses,
      max_uses_per_user: parsed.data.max_uses_per_user ?? null,
      is_active: parsed.data.is_active,
      valid_from: parsed.data.valid_from ? new Date(parsed.data.valid_from).toISOString() : now,
      valid_until: parsed.data.valid_until ? new Date(parsed.data.valid_until).toISOString() : in90,
      used_count: 0,
      created_by: userId,
    }).select().single();
    if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}
