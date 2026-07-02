import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, requireAdminContext } from '@/supabase-server';

export const dynamic = 'force-dynamic';
const LOYALTY_KEYS = ['loyalty_earn_amount_syp','loyalty_earn_points','loyalty_redeem_points_per_syp','loyalty_max_redeem_percent','loyalty_referral_bonus_points'];

export async function GET() {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from('system_settings').select('key,value').in('key', LOYALTY_KEYS);
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  const obj: Record<string,string> = {};
  for (const row of (data ?? [])) { obj[row.key] = row.value ?? ''; }
  return NextResponse.json(obj);
}

export async function PATCH(request: Request) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
const { admin } = ctx;
  const body = await request.json().catch(() => null) as Record<string,string> | null;
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  for (const key of LOYALTY_KEYS) {
    if (body[key] !== undefined) {
      await admin.from('system_settings').upsert({ key, value: String(body[key]), updated_at: new Date().toISOString() } as never, { onConflict: 'key' });
    }
  }
  return NextResponse.json({ ok: true });
}