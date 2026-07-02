import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, requireAdminContext } from '@/supabase-server';

export const dynamic = 'force-dynamic';

const ALLOWED_KEYS = [
  'usd_exchange_rate','max_exchange_days','min_order_value_syp',
  'contact_whatsapp','contact_email',
  'loyalty_earn_amount_syp','loyalty_earn_points',
  'loyalty_point_value_syp','loyalty_max_redemption_pct','loyalty_min_redemption_pts',
  'referral_bonus_points',
];

export async function GET() {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.from('system_settings').select('key,value,description,updated_at').in('key', ALLOWED_KEYS);
    if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { admin } = ctx;
  const body = await request.json().catch(() => null) as unknown;
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const rows = Array.isArray(body)
    ? body
    : body && typeof body === 'object' && Array.isArray((body as { updates?: unknown }).updates)
      ? (body as { updates: unknown[] }).updates
      : [body];

  const allowed = rows
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object')
    .filter((row) => typeof row.key === 'string' && ALLOWED_KEYS.includes(row.key) && row.value !== undefined);
  if (allowed.length === 0) return NextResponse.json({ error: 'No valid keys' }, { status: 400 });
  for (const row of allowed) {
    await admin.from('system_settings').upsert({
      key: String(row.key),
      value: String(row.value),
      description: typeof row.description === 'string' ? row.description : undefined,
      updated_at: new Date().toISOString()
    } as never, { onConflict: 'key' });
  }
  return NextResponse.json({ updated: allowed.length });
}
