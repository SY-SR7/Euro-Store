import { NextResponse } from 'next/server';
import { requireAdminContext } from '@/supabase-server';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminContext('customer_management', 'edit');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
const { admin, userId } = ctx;

  const body = await request.json().catch(() => null) as { points?: number; reason?: string } | null;
  if (!body || typeof body.points !== 'number') return NextResponse.json({ error: 'points required' }, { status: 400 });

  const { data: profile, error: fetchErr } = await admin
    .from('customer_profiles').select('loyalty_points').eq('id', (await params).id).single();
  if (fetchErr) return NextResponse.json({ error: fetchErr?.message || 'database_error' }, { status: 404 });

  const current = (profile as { loyalty_points: number }).loyalty_points ?? 0;
  if (current + body.points < 0) {
    return NextResponse.json({ error: 'insufficient_points' }, { status: 400 });
  }

  const { error: rpcErr } = await admin.rpc('award_loyalty_points', {
    p_customer_id: (await params).id,
    p_points: body.points,
    p_type: 'adjusted_admin',
    p_notes: body.reason ?? 'تعديل يدوي بواسطة الادمن',
    p_processed_by_id: userId,
    p_processed_by_role: 'admin',
  });
  if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 500 });

  const { data: updated } = await admin
    .from('customer_profiles')
    .select('loyalty_points')
    .eq('id', (await params).id)
    .single();

  return NextResponse.json({ loyalty_points: updated?.loyalty_points ?? current + body.points });
}
