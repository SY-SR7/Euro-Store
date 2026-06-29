/* eslint-disable */
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const keys = ['loyalty_earn_amount_syp','loyalty_earn_points','loyalty_redeem_points_per_syp','loyalty_max_redeem_percent','loyalty_referral_bonus_points'];
    const { data } = await supabase.from('system_settings').select('key,value').in('key', keys);
    const obj: Record<string,number> = { loyalty_earn_amount_syp:1000, loyalty_earn_points:10, loyalty_redeem_points_per_syp:1, loyalty_max_redeem_percent:20, loyalty_referral_bonus_points:50 };
    for (const row of (data ?? [])) { obj[row.key] = Number(row.value) || obj[row.key]; }
    return NextResponse.json(obj);
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}