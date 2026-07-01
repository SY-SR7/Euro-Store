/* eslint-disable */
import { NextResponse } from 'next/server';

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
  const result = { ...DEFAULTS };
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (url && key) {
      const keysParam = KEYS.map(k => `key.eq.${k}`).join(',');
      const res = await fetch(
        `${url}/rest/v1/system_settings?or=(${keysParam})&select=key,value`,
        {
          cache: 'no-store',
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        }
      );
      if (res.ok) {
        const rows: { key: string; value: string }[] = await res.json();
        for (const row of rows) {
          if (row.key in result) result[row.key] = Number(row.value) || result[row.key];
        }
      }
    }
  } catch {}

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}