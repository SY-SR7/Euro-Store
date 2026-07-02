import { NextResponse } from 'next/server';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';
import { z } from 'zod';

const schema = z.object({
  name:      z.string().min(1),
  slug:      z.string().regex(/^[a-z0-9-]+$/),
  is_active: z.boolean().default(true),
});

export async function POST(request: Request) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { admin, userId } = ctx;

  try {
    const body: unknown = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

    const { data, error } = await admin.from('brands').insert(parsed.data as never).select('id, name, slug, is_active').single();
    if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

    await writeAuditLog({
      admin, actorId: userId, actorRole: 'admin',
      action: 'brand_create', entityType: 'brands', entityId: data.id,
      afterState: parsed.data as Record<string, unknown>,
    });

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { admin } = ctx;

  const { data, error } = await admin.from('brands').select('id, name, slug, is_active').order('name');
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json(data);
}
