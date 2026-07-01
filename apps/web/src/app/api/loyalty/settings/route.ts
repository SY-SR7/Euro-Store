/* eslint-disable */
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Returns loyalty settings from system_settings table.
 * Canonical DB keys:
 *   loyalty_earn_amount_syp      — SYP spent per earn cycle
 *   loyalty_earn_points          — Points earned per cycle
 *   loyalty_point_value_syp      — SYP value of 1 point (e.g. 10 = 1 pt = 10 SYP)
 *   loyalty_min_redemption_pts   — Min points needed to redeem
 *   loyalty_max_redemption_pct   — Max % of order payable by points
 *   referral_bonus_points        — Points awarded for a successful referral
 */
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const keys = [
      'loyalty_earn_amount_syp',
      'loyalty_earn_points',
      'loyalty_point_value_syp',
      'loyalty_min_redemption_pts',
      'loyalty_max_redemption_pct',
      'referral_bonus_points',
    ];
    const { data } = await supabase.from('system_settings').select('key,value').in('key', keys);

    // Defaults aligned with seed_data.sql
    const obj: Record<string, number> = {
      loyalty_earn_amount_syp: 1000,
      loyalty_earn_points: 10,
      loyalty_point_value_syp: 10,
      loyalty_min_redemption_pts: 100,
      loyalty_max_redemption_pct: 30,
      referral_bonus_points: 50,
    };

    for (const row of (data ?? [])) {
      obj[row.key] = Number(row.value) || obj[row.key];
    }

    return NextResponse.json(obj);
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}