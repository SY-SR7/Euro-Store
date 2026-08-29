import { NextResponse } from 'next/server';
import type { TableUpdate } from '@/lib/database-types';
import { z } from 'zod';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const idSchema = z.string().uuid();
const updateSchema = z.object({
  name_ar: z.string().trim().min(1).max(300).optional(),
  name_en: z.string().trim().min(1).max(300).optional(),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description_ar: z.string().max(20_000).optional(),
  description_en: z.string().max(20_000).optional(),
  category_id: z.string().uuid().nullable().optional(),
  brand_id: z.string().uuid().nullable().optional(),
  size_guide_id: z.string().uuid().nullable().optional(),
  base_price: z.number().int().nonnegative().optional(),
  discount_percentage: z.number().positive().max(100).nullable().optional(),
  discount_start_at: z.string().datetime().nullable().optional(),
  discount_end_at: z.string().datetime().nullable().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  is_featured: z.boolean().optional(),
  is_active: z.boolean().optional(),
  tags: z.array(z.string().trim().min(1).max(80)).max(50).nullable().optional(),
}).strict().superRefine((value, ctx) => {
  if (value.discount_start_at && value.discount_end_at && value.discount_end_at <= value.discount_start_at) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['discount_end_at'], message: 'discount_period_invalid' });
  }
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_request: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext('product_management', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!idSchema.safeParse((await params).id).success) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  const { data, error } = await ctx.admin
    .from('products')
    .select('id,name_ar,name_en,slug,description_ar,description_en,category_id,brand_id,size_guide_id,base_price,discount_percentage,discount_start_at,discount_end_at,status,tags,is_featured,is_active,created_at,updated_at')
    .eq('id', (await params).id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext('product_management', 'edit');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!idSchema.safeParse((await params).id).success) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  if (Object.keys(parsed.data).length === 0) return NextResponse.json({ error: 'no_changes' }, { status: 400 });

  const update: TableUpdate<'products'> = { ...parsed.data };
  if (!parsed.data.status && typeof parsed.data.is_active === 'boolean') {
    update.status = parsed.data.is_active ? 'published' : 'archived';
  }
  if (parsed.data.status) update.is_active = parsed.data.status === 'published';

  const { data: before, error: beforeError } = await ctx.admin
    .from('products')
    .select('*')
    .eq('id', (await params).id)
    .maybeSingle();
  if (beforeError) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!before) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { data, error } = await ctx.admin
    .from('products')
    .update(update)
    .eq('id', (await params).id)
    .select()
    .single();
  if (error) {
    const conflict = error.code === '23505';
    return NextResponse.json({ error: conflict ? 'product_exists' : 'database_error' }, { status: conflict ? 409 : 500 });
  }

  await writeAuditLog({
    admin: ctx.admin,
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'product.updated',
    entityType: 'products',
    entityId: (await params).id,
    beforeState: before,
    afterState: update,
  });

  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext('product_management', 'delete');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!idSchema.safeParse((await params).id).success) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  const { data: before, error: beforeError } = await ctx.admin
    .from('products')
    .select('*')
    .eq('id', (await params).id)
    .maybeSingle();
  if (beforeError) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!before) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { data, error } = await ctx.admin
    .from('products')
    .update({ status: 'archived', is_active: false })
    .eq('id', (await params).id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

  await writeAuditLog({
    admin: ctx.admin,
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'product.archived',
    entityType: 'products',
    entityId: (await params).id,
    beforeState: before,
    afterState: { status: 'archived', is_active: false },
  });

  return NextResponse.json({ product: data, archived: true });
}
