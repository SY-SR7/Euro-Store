import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, requireAdminContext } from '@/supabase-server';

export const dynamic = 'force-dynamic';

const ALLOWED_KEYS = [
  'usd_exchange_rate','max_exchange_days',
  'loyalty_earn_amount_syp','loyalty_earn_points',
  'loyalty_redeem_points_per_syp','loyalty_max_redeem_percent',
  'loyalty_referral_bonus_points','referral_bonus_points',
];

export async function GET() {
  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.from('system_settings').select('key,value,description,updated_at').in('key', ALLOWED_KEYS);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { admin } = ctx;
  const body = await request.json().catch(() => null) as Array<{ key: string; value: string }> | { key: string; value: string } | null;
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  const rows = Array.isArray(body) ? body : [body];
  const allowed = rows.filter(r => ALLOWED_KEYS.includes(r.key));
  if (allowed.length === 0) return NextResponse.json({ error: 'No valid keys' }, { status: 400 });
  for (const row of allowed) {
    await admin.from('system_settings').upsert({ key: row.key, value: String(row.value), updated_at: new Date().toISOString() } as never, { onConflict: 'key' });
  }
  return NextResponse.json({ updated: allowed.length });
}