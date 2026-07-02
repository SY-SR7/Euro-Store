import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, requireAdminContext } from '@/supabase-server';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
const { admin, userId } = ctx;

  const body = await request.json().catch(() => null) as { points?: number; reason?: string } | null;
  if (!body || typeof body.points !== 'number') return NextResponse.json({ error: 'points required' }, { status: 400 });

  const { data: profile, error: fetchErr } = await admin
    .from('customer_profiles').select('loyalty_points').eq('id', params.id).single();
  if (fetchErr) return NextResponse.json({ error: error?.message || 'database_error' }, { status: 404 });

  const current = (profile as { loyalty_points: number }).loyalty_points ?? 0;
  const newPoints = Math.max(0, current + body.points);

  const { error: updateErr } = await admin
    .from('customer_profiles').update({ loyalty_points: newPoints }).eq('id', params.id);
  if (updateErr) return NextResponse.json({ error: error?.message || 'database_error' }, { status: 500 });

  // سجّل في loyalty_transactions بدون تعطيل تعديل النقاط إذا فشل السجل الثانوي.
  await admin.from('loyalty_transactions').insert({
    customer_id: params.id,
    points: body.points,
    type: 'adjusted_admin',
    notes: body.reason ?? 'تعديل يدوي بواسطة الادمن',
    processed_by_id: userId,
    processed_by_role: 'admin',
  });

  return NextResponse.json({ loyalty_points: newPoints });
}
