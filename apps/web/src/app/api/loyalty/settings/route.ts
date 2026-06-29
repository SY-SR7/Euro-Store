/* eslint-disable */
// @ts-nocheck
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

const KEYS = [
  'loyalty_earn_amount_syp',
  'loyalty_earn_points',
  'loyalty_redeem_points_per_syp',
  'loyalty_max_redeem_percent',
  'loyalty_referral_bonus_points',
];

export async function GET() {
  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from('system_settings')
      .select('key, value')
      .in('key', KEYS);

    if (error) {
      // fallback defaults if DB unreachable
      return NextResponse.json({
        earn_amount_syp:       1000,
        earn_points:           10,
        redeem_points_per_syp: 100,
        max_redeem_percent:    30,
        referral_bonus_points: 50,
      });
    }

    const map = Object.fromEntries((data ?? []).map(r => [r.key, Number(r.value)]));
    return NextResponse.json({
      earn_amount_syp:       map['loyalty_earn_amount_syp']       ?? 1000,
      earn_points:           map['loyalty_earn_points']           ?? 10,
      redeem_points_per_syp: map['loyalty_redeem_points_per_syp'] ?? 100,
      max_redeem_percent:    map['loyalty_max_redeem_percent']     ?? 30,
      referral_bonus_points: map['loyalty_referral_bonus_points']  ?? 50,
    });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}