import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, requireAdminContext } from '@/supabase-server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  code:             z.string().min(1).transform(s => s.toUpperCase()),
  type:             z.enum(['percentage', 'fixed']),
  value:            z.number().positive(),
  min_order_syp:    z.number().nonnegative().default(0),
  valid_from:       z.string().optional(),
  valid_until:      z.string().optional(),
  max_uses:         z.number().int().positive().nullable().optional(),
  is_active:        z.boolean().default(true),
});

export async function GET() {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from('discount_codes')
      .select('id,code,type,value,min_order_syp,valid_from,valid_until,max_uses,used_count,is_active,created_at')
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}

export async function POST(request: Request) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { admin } = ctx;
  try {
    const body: unknown = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 });
    const now = new Date().toISOString();
    const in90 = new Date(Date.now() + 90*24*60*60*1000).toISOString();
    const { data, error } = await admin.from('discount_codes').insert({
      ...parsed.data,
      valid_from: parsed.data.valid_from ? new Date(parsed.data.valid_from).toISOString() : now,
      valid_until: parsed.data.valid_until ? new Date(parsed.data.valid_until).toISOString() : in90,
      used_count: 0,
    } as never).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}