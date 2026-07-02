import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, requireAdminContext, writeAuditLog } from '@/supabase-server';

interface RouteParams { params: { id: string } }

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('customer_profiles')
    .select('id,full_name,phone,email,created_at,loyalty_points,referral_code,is_blocked')
    .eq('id', params.id)
    .single();
  if (error) return NextResponse.json({ error: error?.message || 'database_error' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
const { admin, userId } = ctx;

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (typeof body.full_name === 'string') update.full_name = body.full_name;
  if (typeof body.phone === 'string') update.phone = body.phone;
  if (typeof body.email === 'string') update.email = body.email;
  if (typeof body.is_blocked === 'boolean') update.is_blocked = body.is_blocked;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data: before } = await admin
    .from('customer_profiles')
    .select('id,full_name,phone,email,is_blocked')
    .eq('id', params.id)
    .single();

  const { data, error } = await admin
    .from('customer_profiles')
    .update(update as never)
    .eq('id', params.id)
    .select('id,full_name,phone,email,created_at,loyalty_points,referral_code,is_blocked')
    .single();

  if (error) return NextResponse.json({ error: error?.message || 'database_error' }, { status: 500 });

  await writeAuditLog({
    admin,
    actorId: userId,
    actorRole: 'admin',
    action: 'customer_update',
    entityType: 'customer_profiles',
    entityId: params.id,
    beforeState: before as Record<string, unknown> | null,
    afterState: update,
  });

  return NextResponse.json(data);
}
