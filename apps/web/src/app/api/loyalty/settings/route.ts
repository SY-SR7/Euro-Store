import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, getSessionClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const KEYS = [
  'loyalty_earn_amount_syp',
  'loyalty_earn_points',
  'loyalty_point_value_syp',
  'loyalty_min_redemption_pts',
  'loyalty_max_redemption_pct',
  'referral_bonus_points',
];

const DEFAULTS: Record<string, number> = {
  loyalty_earn_amount_syp: 1000,
  loyalty_earn_points: 10,
  loyalty_point_value_syp: 10,
  loyalty_min_redemption_pts: 100,
  loyalty_max_redemption_pct: 30,
  referral_bonus_points: 50,
};

export async function GET() {
  const { user } = await getSessionClient();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const result = { ...DEFAULTS };
  const admin = createAdminSupabaseClient();
  const { data: rows } = await admin.from('system_settings').select('key, value').in('key', KEYS);
  for (const row of rows ?? []) {
    if (row.key in result) result[row.key] = Number(row.value) || result[row.key];
  }

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  });
}
